import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, ILike, Raw } from 'typeorm';
import { Room, RoomStatus } from './entities/room.entity';
import { RoomType } from './entities/room-type.entity';
import { Guest } from './entities/guest.entity';
import { Reservation, ReservationStatus } from './entities/reservation.entity';
import { RoomRate } from './entities/room-rate.entity';
import { CancellationPolicy } from './entities/cancellation-policy.entity';
import { Invoice, InvoiceStatus, InvoiceType } from './entities/invoice.entity';
import { CleaningRequest, CleaningStatus, CleaningType } from './entities/cleaning-request.entity';
import { HousekeepingStaff, StaffRole } from './entities/housekeeping-staff.entity';
import { MaintenanceRequest, MaintenanceStatus, MaintenancePriority } from './entities/maintenance-request.entity';
import { MaintenanceStaff, MaintenanceStaffRole } from './entities/maintenance-staff.entity';
import { RestaurantTable, TableStatus } from './entities/restaurant-table.entity';
import { MenuCategory } from './entities/menu-category.entity';
import { MenuItem } from './entities/menu-item.entity';
import { RestaurantOrder, OrderStatus, OrderType, PaymentMethod } from './entities/restaurant-order.entity';
import { LoyaltyTier, LoyaltyPoints, LoyaltyTransaction, LoyaltyRedemption, TierName } from './entities/loyalty.entity';
import { CashDrawer, CashDrawerTransaction, DrawerStatus, AuditType } from './entities/cash-drawer.entity';
import { ReservationAlert, PaymentSplit, DepositTransfer, SharedInventoryLink, AlertType, AlertSeverity } from './entities/pms-extensions.entity';
import { AccountingService } from '../accounting/accounting.service';

@Injectable()
export class PmsService {
    constructor(
        @InjectRepository(Room) private roomRepo: Repository<Room>,
        @InjectRepository(RoomType) private roomTypeRepo: Repository<RoomType>,
        @InjectRepository(Guest) private guestRepo: Repository<Guest>,
        @InjectRepository(Reservation) private reservationRepo: Repository<Reservation>,
        @InjectRepository(RoomRate) private roomRateRepo: Repository<RoomRate>,
        @InjectRepository(CancellationPolicy) private policyRepo: Repository<CancellationPolicy>,
        @InjectRepository(Invoice) private invoiceRepo: Repository<Invoice>,
        @InjectRepository(CleaningRequest) private cleaningRepo: Repository<CleaningRequest>,
        @InjectRepository(HousekeepingStaff) private staffRepo: Repository<HousekeepingStaff>,
        @InjectRepository(MaintenanceRequest) private maintenanceRepo: Repository<MaintenanceRequest>,
        @InjectRepository(MaintenanceStaff) private maintenanceStaffRepo: Repository<MaintenanceStaff>,
        @InjectRepository(RestaurantTable) private tableRepo: Repository<RestaurantTable>,
        @InjectRepository(MenuCategory) private categoryRepo: Repository<MenuCategory>,
        @InjectRepository(MenuItem) private menuItemRepo: Repository<MenuItem>,
        @InjectRepository(RestaurantOrder) private orderRepo: Repository<RestaurantOrder>,
        @InjectRepository(LoyaltyTier) private loyaltyTierRepo: Repository<LoyaltyTier>,
        @InjectRepository(LoyaltyPoints) private loyaltyPointsRepo: Repository<LoyaltyPoints>,
        @InjectRepository(LoyaltyTransaction) private loyaltyTransRepo: Repository<LoyaltyTransaction>,
        @InjectRepository(LoyaltyRedemption) private loyaltyRedempRepo: Repository<LoyaltyRedemption>,
        @InjectRepository(CashDrawer) private drawerRepo: Repository<CashDrawer>,
        @InjectRepository(CashDrawerTransaction) private drawerTransRepo: Repository<CashDrawerTransaction>,
        @InjectRepository(ReservationAlert) private alertRepo: Repository<ReservationAlert>,
        @InjectRepository(PaymentSplit) private splitRepo: Repository<PaymentSplit>,
        @InjectRepository(DepositTransfer) private depositTransRepo: Repository<DepositTransfer>,
        @InjectRepository(SharedInventoryLink) private sharedInvRepo: Repository<SharedInventoryLink>,
        private dataSource: DataSource,
        private accountingService: AccountingService,
    ) {}

    // ─── ROOM TYPES ───────────────────────────────────────────
    async getRoomTypes(companyId: string) {
        return this.roomTypeRepo.find({
            where: { company: { id: companyId } },
            relations: ['rooms'],
            order: { name: 'ASC' }
        });
    }

    async createRoomType(companyId: string, data: any) {
        console.log('[createRoomType] companyId:', companyId, 'data:', data);
        if (!companyId) {
            throw new Error('No hay empresa seleccionada');
        }
        if (!data.name) throw new Error('El nombre es requerido');
        if (!data.basePrice) data.basePrice = 0;
        if (!data.capacity) data.capacity = 2;
        
        const rt = this.roomTypeRepo.create({ 
            name: data.name,
            description: data.description || '',
            basePrice: Number(data.basePrice),
            capacity: Number(data.capacity),
            company: { id: companyId } 
        });
        return this.roomTypeRepo.save(rt);
    }

    async updateRoomType(id: string, data: any) {
        await this.roomTypeRepo.update(id, data);
        return this.roomTypeRepo.findOne({ where: { id }, relations: ['rooms'] });
    }

    async deleteRoomType(id: string) {
        return this.roomTypeRepo.delete(id);
    }

    // ─── ROOMS ───────────────────────────────────────────────
    async getRooms(companyId: string) {
        return this.roomRepo.find({
            where: { companyId },
            relations: ['roomType'],
            order: { number: 'ASC' }
        });
    }

    async createRoom(companyId: string, data: any) {
        const room = this.roomRepo.create({
            ...data,
            company: { id: companyId },
            roomType: { id: data.roomTypeId }
        });
        return this.roomRepo.save(room);
    }

    async updateRoom(id: string, data: any) {
        const payload: any = { ...data };
        if (data.roomTypeId) payload.roomType = { id: data.roomTypeId };
        await this.roomRepo.update(id, payload);
        return this.roomRepo.findOne({ where: { id }, relations: ['roomType'] });
    }

    async updateRoomStatus(id: string, status: RoomStatus, data?: { issue?: string; notes?: string }) {
        const room = await this.roomRepo.findOne({ where: { id }, relations: ['company'] });
        const companyId = room?.companyId || room?.company?.id;
        
        if (status === RoomStatus.MAINTENANCE && room?.status !== RoomStatus.MAINTENANCE) {
            const existingPending = await this.maintenanceRepo.findOne({
                where: { roomId: id, status: MaintenanceStatus.PENDING }
            });
            
            if (!existingPending) {
                await this.maintenanceRepo.save({
                    roomId: id,
                    companyId: companyId,
                    requestedDate: new Date(),
                    issue: data?.issue || 'Mantenimiento solicitado desde tablero',
                    description: data?.notes || '',
                    priority: MaintenancePriority.MEDIUM,
                    status: MaintenanceStatus.PENDING
                });
            }
        }
        
        if (status === RoomStatus.AVAILABLE && room?.status === RoomStatus.MAINTENANCE) {
            await this.maintenanceRepo.update(
                { roomId: id, status: MaintenanceStatus.PENDING },
                { status: MaintenanceStatus.CANCELLED } as any
            );
        }
        
        await this.roomRepo.update(id, { status });

        // Automatización: Si el estado cambia a CLEANING o MAINTENANCE, crear solicitud automáticamente
        if (companyId) {
            if (status === RoomStatus.CLEANING) {
                await this.createCleaningRequest(companyId, { roomId: id, type: 'TURNOVER' });
            } else if (status === RoomStatus.MAINTENANCE) {
                await this.createMaintenanceRequest(companyId, { roomId: id, notes: 'Creado automáticamente desde el tablero' });
            }
        }

        return this.roomRepo.findOne({ where: { id }, relations: ['roomType'] });
    }

    async deleteRoom(id: string) {
        return this.roomRepo.delete(id);
    }

    async blockRoom(id: string, reason: string, blockedFrom: Date, blockedTo: Date) {
        const room = await this.roomRepo.findOne({ where: { id } });
        if (!room) throw new Error('Habitación no encontrada');
        
        room.status = RoomStatus.BLOCKED;
        await this.roomRepo.save(room);
        
        const reservation = this.reservationRepo.create({
            roomId: id,
            companyId: room.companyId,
            checkIn: blockedFrom,
            checkOut: blockedTo,
            status: ReservationStatus.BLOCKED,
            totalAmount: 0,
            adults: 0,
            children: 0,
            specialRequests: reason,
            isBlocked: true
        });
        await this.reservationRepo.save(reservation);
        
        return { room, reservation };
    }

    async unblockRoom(id: string) {
        const room = await this.roomRepo.findOne({ where: { id } });
        if (!room) throw new Error('Habitación no encontrada');
        
        await this.reservationRepo.update(
            { roomId: id, isBlocked: true, status: ReservationStatus.BLOCKED },
            { status: ReservationStatus.CANCELLED } as any
        );
        
        room.status = RoomStatus.AVAILABLE;
        await this.roomRepo.save(room);
        return room;
    }

    async transferRoom(reservationId: string, newRoomId: string) {
        const reservation = await this.reservationRepo.findOne({ 
            where: { id: reservationId },
            relations: ['room']
        });
        if (!reservation) throw new Error('Reservación no encontrada');
        
        const newRoom = await this.roomRepo.findOne({ where: { id: newRoomId } });
        if (!newRoom) throw new Error('Habitación destino no encontrada');
        if (newRoom.status !== RoomStatus.AVAILABLE) {
            throw new Error('La habitación destino no está disponible');
        }
        
        const oldRoomId = reservation.roomId;
        const oldRoom = await this.roomRepo.findOne({ where: { id: oldRoomId } });
        if (oldRoom) {
            oldRoom.status = RoomStatus.AVAILABLE;
            await this.roomRepo.save(oldRoom);
        }
        
        reservation.roomId = newRoomId;
        reservation.room = newRoom;
        await this.reservationRepo.save(reservation);
        
        newRoom.status = RoomStatus.OCCUPIED;
        await this.roomRepo.save(newRoom);
        
        return { reservation, newRoom, oldRoomId };
    }

    // ─── ROOM RATES ─────────────────────────────────────────
    async getRoomRates(companyId: string, roomTypeId?: string) {
        const where: any = { isActive: true };
        if (roomTypeId) where.roomTypeId = roomTypeId;
        return this.roomRateRepo.find({
            where,
            order: { startDate: 'DESC' }
        });
    }

    async createRoomRate(companyId: string, data: any) {
        const rate = this.roomRateRepo.create({
            ...data,
            roomType: data.roomTypeId ? { id: data.roomTypeId } : null,
            company: { id: companyId }
        });
        return this.roomRateRepo.save(rate);
    }

    async updateRoomRate(id: string, data: any) {
        const payload: any = { ...data };
        if (data.roomTypeId) payload.roomType = { id: data.roomTypeId };
        await this.roomRateRepo.update(id, payload);
        return this.roomRateRepo.findOne({ where: { id } });
    }

    async deleteRoomRate(id: string) {
        return this.roomRateRepo.delete(id);
    }

    async calculateRate(roomTypeId: string, checkIn: Date, checkOut: Date, adults: number, children: number) {
        const nights = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));
        
        const rates = await this.roomRateRepo.find({
            where: {
                roomTypeId,
                isActive: true
            }
        });

        const checkInDate = new Date(checkIn);
        let basePrice = 0;
        let totalRate = 0;
        let appliedRate: any = null;

        for (const rate of rates) {
            const start = new Date(rate.startDate);
            const end = new Date(rate.endDate);
            
            if (checkInDate >= start && checkInDate <= end) {
                if (nights >= rate.minNights && (rate.maxNights === 0 || nights <= rate.maxNights)) {
                    basePrice = Number(rate.price);
                    appliedRate = rate;
                    break;
                }
            }
        }

        if (!appliedRate) {
            const roomType = await this.roomTypeRepo.findOne({ where: { id: roomTypeId } });
            basePrice = roomType?.basePrice || 0;
        }

        if (appliedRate && Number(appliedRate.extraAdultPrice) > 0 && adults > 2) {
            totalRate = (basePrice * nights) + (Number(appliedRate.extraAdultPrice) * (adults - 2) * nights);
        } else {
            totalRate = basePrice * nights;
        }

        if (appliedRate && Number(appliedRate.childPrice) > 0 && children > 0) {
            totalRate += Number(appliedRate.childPrice) * children;
        }

        return {
            nightlyRate: basePrice,
            totalRate,
            nights,
            adults,
            children,
            appliedRate: appliedRate?.rateCode || 'STANDARD',
            breakdown: {
                base: basePrice * nights,
                extraAdults: appliedRate && Number(appliedRate.extraAdultPrice) > 0 ? Number(appliedRate.extraAdultPrice) * (adults - 2) * nights : 0,
                children: appliedRate && Number(appliedRate.childPrice) > 0 ? Number(appliedRate.childPrice) * children : 0
            }
        };
    }

    // ─── CANCELLATION POLICIES ─────────────────────────────────
    async getCancellationPolicies(companyId: string) {
        return this.policyRepo.find({
            where: { company: { id: companyId } },
            order: { daysBeforeCheckIn: 'ASC' }
        });
    }

    async createCancellationPolicy(companyId: string, data: any) {
        const policy = this.policyRepo.create({
            ...data,
            company: { id: companyId }
        });
        return this.policyRepo.save(policy);
    }

    async updateCancellationPolicy(id: string, data: any) {
        await this.policyRepo.update(id, data);
        return this.policyRepo.findOne({ where: { id } });
    }

    async deleteCancellationPolicy(id: string) {
        return this.policyRepo.delete(id);
    }

    async calculateCancellationPenalty(reservationId: string, cancellationDate?: Date) {
        const reservation = await this.reservationRepo.findOne({ 
            where: { id: reservationId },
            relations: ['room', 'guest']
        });
        
        if (!reservation) throw new Error('Reserva no encontrada');
        if (reservation.status !== ReservationStatus.PENDING && reservation.status !== ReservationStatus.CONFIRMED) {
            throw new Error('Solo se pueden cancelar reservas pendientes o confirmadas');
        }

        const cancelDate = cancellationDate || new Date();
        const checkInDate = new Date(reservation.checkIn);
        const daysBefore = Math.ceil((checkInDate.getTime() - cancelDate.getTime()) / (1000 * 60 * 60 * 24));

        const policies = await this.policyRepo.find({
            where: { isActive: true },
            order: { daysBeforeCheckIn: 'ASC' }
        });

        let applicablePolicy: any = null;
        for (const policy of policies) {
            if (daysBefore >= policy.daysBeforeCheckIn) {
                applicablePolicy = policy;
            }
        }

        if (!applicablePolicy) {
            return {
                canCancel: true,
                penalty: 0,
                message: 'Sin cargo por cancelación'
            };
        }

        let penalty = 0;
        if (Number(applicablePolicy.penaltyPercentage) > 0) {
            penalty = Number(reservation.totalAmount) * (Number(applicablePolicy.penaltyPercentage) / 100);
        } else if (Number(applicablePolicy.penaltyNights) > 0) {
            penalty = Number(reservation.ratePerNight) * Number(applicablePolicy.penaltyNights);
        } else if (Number(applicablePolicy.penaltyFixed) > 0) {
            penalty = Number(applicablePolicy.penaltyFixed);
        }

        return {
            canCancel: true,
            penalty,
            policy: applicablePolicy.name,
            daysBefore,
            message: `Aplicando política: ${applicablePolicy.name}. Cargo: $${penalty.toLocaleString()}`
        };
    }

    // ─── REPORTS ──────────────────────────────────────────────
    async getOccupancyDashboard(companyId: string) {
        const [available, occupied, cleaning, maintenance] = await Promise.all([
            this.roomRepo.count({ where: { company: { id: companyId }, status: RoomStatus.AVAILABLE } }),
            this.roomRepo.count({ where: { company: { id: companyId }, status: RoomStatus.OCCUPIED } }),
            this.roomRepo.count({ where: { company: { id: companyId }, status: RoomStatus.CLEANING } }),
            this.roomRepo.count({ where: { company: { id: companyId }, status: RoomStatus.MAINTENANCE } }),
        ]);

        const rooms = await this.roomRepo.find({
            where: { companyId },
            relations: ['roomType']
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Reservas activas con check-in hoy
        const activeReservations = await this.reservationRepo.find({
            where: {
                companyId,
                status: ReservationStatus.CHECKED_IN,
            },
            relations: ['room', 'guest']
        });

        // Llegadas hoy (reservas confirmadas para hoy)
        const arrivingToday = await this.reservationRepo.find({
            where: {
                companyId,
                status: ReservationStatus.CONFIRMED,
            },
            relations: ['room', 'guest']
        });

        // Filtrar solo las que aplican hoy
        const todayStart = new Date(today);
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59, 999);

        const arrivingTodayList = arrivingToday.filter(r => {
            const checkIn = new Date(r.checkIn);
            return checkIn >= todayStart && checkIn <= todayEnd;
        });

        const departingTodayList = activeReservations.filter(r => {
            if (!r.checkOut) return false;
            const checkOut = new Date(r.checkOut);
            return checkOut >= todayStart && checkOut <= todayEnd;
        });

        // Calcular ADR, RevPAR y estadisticas semanales
        const last7Days: any[] = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            d.setHours(0, 0, 0, 0);
            const dEnd = new Date(d);
            dEnd.setHours(23, 59, 59, 999);
            last7Days.push({
                date: d.toISOString().split('T')[0],
                occupied: 0,
                revenue: 0
            });
        }

        // Obtener reservas de los ultimos 7 dias para estadisticas
        const recentReservations = await this.reservationRepo.find({
            where: {
                companyId,
                status: ReservationStatus.CHECKED_OUT,
            },
            relations: ['room']
        });

        let totalRevenue = 0;
        let totalNights = 0;

        for (const res of recentReservations) {
            if ((res as any).totalPaid) {
                totalRevenue += Number((res as any).totalPaid);
            }
            if (res.checkIn && res.checkOut) {
                const nights = Math.ceil((new Date(res.checkOut).getTime() - new Date(res.checkIn).getTime()) / (1000 * 60 * 60 * 24));
                totalNights += nights;
            }
        }

        const adr = occupied > 0 ? Math.round(totalRevenue / occupied) : 0;
        const revpar = rooms.length > 0 ? Math.round(totalRevenue / rooms.length) : 0;

        // Generar alertas
        const alerts: any[] = [];
        
        // Alerta de salidas tarde
        for (const res of activeReservations) {
            if (res.hasRedAlert) {
                alerts.push({ type: 'RED', message: res.alertMessage || 'Alerta roja', reservationNumber: res.reservationNumber, roomNumber: res.room?.number });
            }
            if (res.hasYellowAlert) {
                alerts.push({ type: 'YELLOW', message: res.alertMessage || 'Alerta amarilla', reservationNumber: res.reservationNumber, roomNumber: res.room?.number });
            }
        }

        // Alerta de late check-out
        const now = new Date();
        const checkOutTime = new Date(now);
        checkOutTime.setHours(14, 0, 0, 0);
        for (const res of activeReservations) {
            if (res.checkOut && new Date(res.checkOut) < checkOutTime && now > checkOutTime) {
                alerts.push({ type: 'LATE_CHECKOUT', message: 'Check-out vencido', reservationNumber: res.reservationNumber, roomNumber: res.room?.number });
            }
        }

        // Sincronizar habitaciones con reservas activas
        for (const reservation of activeReservations) {
            if (reservation.room && reservation.room.status !== RoomStatus.OCCUPIED) {
                await this.roomRepo.update(reservation.room.id, { status: RoomStatus.OCCUPIED });
            }
        }

        // Crear mapa de huéspedes por habitación
        const guestsPerRoom: { [roomId: string]: any[] } = {};
        for (const res of activeReservations) {
            if (res.roomId) {
                if (!guestsPerRoom[res.roomId]) {
                    guestsPerRoom[res.roomId] = [];
                }
                guestsPerRoom[res.roomId].push({
                    guestId: res.guestId,
                    reservationId: res.id,
                    guestName: res.guest ? `${res.guest.firstName} ${res.guest.lastName}` : 'Sin huésped',
                    guestEmail: res.guest?.email || '',
                    guestPhone: res.guest?.phone || '',
                    checkIn: res.checkIn,
                    checkOut: res.checkOut,
                    actualCheckIn: res.actualCheckInTime,
                    reservationNumber: res.reservationNumber,
                    status: res.status,
                    hasRedAlert: res.hasRedAlert,
                    hasYellowAlert: res.hasYellowAlert,
                    alertMessage: res.alertMessage
                });
            }
        }

        return {
            total: rooms.length,
            totalRooms: rooms.length,
            occupied,
            available,
            maintenance,
            cleaning,
            occupancyRate: rooms.length > 0 ? Math.round((occupied / rooms.length) * 100) : 0,
            activeReservations,
            guestsPerRoom,
            arrivingToday: arrivingTodayList.map(r => ({
                reservationNumber: r.reservationNumber,
                guestName: r.guest ? `${r.guest.firstName} ${r.guest.lastName}` : 'Sin huésped',
                roomNumber: r.room?.number,
                roomId: r.room?.id,
                checkIn: r.checkIn,
                checkOut: r.checkOut,
                status: r.status
            })),
            departingToday: departingTodayList.map(r => ({
                reservationNumber: r.reservationNumber,
                guestName: r.guest ? `${r.guest.firstName} ${r.guest.lastName}` : 'Sin huésped',
                roomNumber: r.room?.number,
                roomId: r.room?.id,
                checkOut: r.checkOut,
                status: r.status
            })),
            stats: {
                adr,
                revpar,
                avgStay: totalNights > 0 ? Math.round(totalNights / (recentReservations.length || 1)) : 0,
                weeklyTrend: last7Days
            },
            alerts,
            rooms
        };
    }

    async getTapeChart(companyId: string, start: string, end: string) {
        const startDate = new Date(start);
        const endDate = new Date(end);

        const roomTypes = await this.roomTypeRepo.find({
            where: { company: { id: companyId } },
            relations: ['rooms'],
            order: { name: 'ASC' }
        });

        const reservations = await this.reservationRepo.find({
            where: {
                companyId,
                status: In([ReservationStatus.PENDING, ReservationStatus.CONFIRMED, ReservationStatus.CHECKED_IN, ReservationStatus.BLOCKED]),
                checkIn: Raw(alias => `${alias} < :end`, { end: endDate }),
                checkOut: Raw(alias => `${alias} > :start`, { start: startDate })
            },
            relations: ['room', 'guest']
        });

        // Agrupar habitaciones por tipo para el frontend
        const grid = roomTypes.map(rt => ({
            id: rt.id,
            name: rt.name,
            rooms: rt.rooms.map(r => ({
                id: r.id,
                number: r.number,
                status: r.status,
                reservations: reservations
                    .filter(res => res.roomId === r.id)
                    .map(res => ({
                        id: res.id,
                        number: res.reservationNumber,
                        guestName: res.guest ? `${res.guest.firstName} ${res.guest.lastName}` : 'N/A',
                        checkIn: res.checkIn,
                        checkOut: res.checkOut,
                        status: res.status,
                        isUrgent: res.hasRedAlert
                    }))
            }))
        }));

        return grid;
    }

    // ─── GUESTS ──────────────────────────────────────────────
    async getGuests(companyId: string, search?: string) {
        const qb = this.guestRepo.createQueryBuilder('guest')
            .where('guest.companyId = :companyId', { companyId })
            .orderBy('guest.lastName', 'ASC');

        if (search) {
            qb.andWhere(
                '(guest.firstName ILIKE :s OR guest.lastName ILIKE :s OR guest.docNumber ILIKE :s OR guest.email ILIKE :s)',
                { s: `%${search}%` }
            );
        }
        return qb.getMany();
    }

    async createGuest(companyId: string, data: any) {
        const guest = this.guestRepo.create({ ...data, company: { id: companyId } });
        return this.guestRepo.save(guest);
    }

    async updateGuest(id: string, data: any) {
        await this.guestRepo.update(id, data);
        return this.guestRepo.findOneBy({ id });
    }

    async deleteGuest(id: string) {
        return this.guestRepo.delete(id);
    }

    // ─── RESERVATIONS ────────────────────────────────────────
    async getReservations(companyId: string, status?: string) {
        const where: any = { company: { id: companyId } };
        if (status) where.status = status;
        return this.reservationRepo.find({
            where,
            relations: ['room', 'room.roomType', 'guest'],
            order: { checkIn: 'DESC' }
        });
    }

    async getReservation(id: string) {
        return this.reservationRepo.findOne({
            where: { id },
            relations: ['room', 'room.roomType', 'guest']
        });
    }

    async createReservation(companyId: string, data: any) {
        const checkIn = new Date(data.checkIn);
        const checkOut = new Date(data.checkOut);

        if (checkOut <= checkIn) {
            throw new Error('La fecha de check-out debe ser posterior a la de check-in');
        }

        const conflicts = await this.reservationRepo
            .createQueryBuilder('r')
            .where('r.roomId = :roomId', { roomId: data.roomId })
            .andWhere('r.status != :cancelled', { cancelled: ReservationStatus.CANCELLED })
            .andWhere('r.status != :noShow', { noShow: ReservationStatus.NO_SHOW })
            .andWhere('r.checkIn < :checkOut', { checkOut })
            .andWhere('r.checkOut > :checkIn', { checkIn })
            .getMany();

        if (conflicts.length > 0) {
            const conflict = conflicts[0];
            throw new Error(`La habitación no está disponible. Conflicto con reserva ${conflict.reservationNumber} (${new Date(conflict.checkIn).toLocaleDateString()} - ${new Date(conflict.checkOut).toLocaleDateString()})`);
        }

        const count = await this.reservationRepo.count({ where: { company: { id: companyId } } });
        const reservationNumber = `RES-${String(count + 1).padStart(5, '0')}`;

        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
        const totalAmount = Number(data.ratePerNight) * nights;

        const status = data.autoConfirm ? ReservationStatus.CONFIRMED : ReservationStatus.PENDING;

        const reservation = this.reservationRepo.create({
            ...data,
            reservationNumber,
            totalAmount,
            status,
            company: { id: companyId },
            room: { id: data.roomId },
            guest: { id: data.guestId },
        });

        return this.reservationRepo.save(reservation);
    }

    async updateReservation(id: string, data: any) {
        const payload: any = { ...data };
        if (data.roomId) payload.room = { id: data.roomId };
        if (data.guestId) payload.guest = { id: data.guestId };
        await this.reservationRepo.update(id, payload);
        return this.getReservation(id);
    }

    async checkIn(id: string, data?: { guestSignature?: string; idDocumentType?: string; idDocumentNumber?: string; keyCardNumber?: string }) {
        const reservation = await this.reservationRepo.findOne({ where: { id }, relations: ['room'] });
        if (!reservation) throw new Error('Reserva no encontrada');
        if (![ReservationStatus.PENDING, ReservationStatus.CONFIRMED].includes(reservation.status)) {
            throw new Error('La reserva debe estar pendiente o confirmada para hacer check-in');
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkInDate = new Date(reservation.checkIn);
        checkInDate.setHours(0, 0, 0, 0);

        if (today < checkInDate) {
            const daysAhead = Math.ceil((checkInDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            if (daysAhead > 1) {
                throw new Error(`El check-in solo se puede realizar a partir del ${new Date(reservation.checkIn).toLocaleDateString()}`);
            }
        }

        const checkOutDate = new Date(reservation.checkOut);
        checkOutDate.setHours(0, 0, 0, 0);
        if (today > checkOutDate) {
            await this.reservationRepo.update(id, { status: ReservationStatus.NO_SHOW });
            throw new Error('La reserva ha vencido. Marque como no-show');
        }

        const updateData: any = { 
            status: ReservationStatus.CHECKED_IN,
            actualCheckInTime: new Date()
        };
        
        if (data?.guestSignature) updateData.guestSignature = data.guestSignature;
        if (data?.idDocumentType) updateData.idDocumentType = data.idDocumentType;
        if (data?.idDocumentNumber) updateData.idDocumentNumber = data.idDocumentNumber;
        if (data?.keyCardNumber) {
            updateData.keyCardNumber = data.keyCardNumber;
            updateData.keyCardIssuedAt = new Date();
        }

        await this.reservationRepo.update(id, updateData);
        await this.roomRepo.update(reservation.room.id, { status: RoomStatus.OCCUPIED });
        return this.getReservation(id);
    }

    async checkOut(id: string, data?: { forceLateCheckout?: boolean; applyLateFee?: boolean; keyCardReturned?: boolean; notes?: string }) {
        const reservation = await this.reservationRepo.findOne({ where: { id }, relations: ['room', 'company'] });
        if (!reservation) throw new Error('Reserva no encontrada');

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const originalCheckOut = new Date(reservation.checkOut);
        originalCheckOut.setHours(0, 0, 0, 0);

        let extraCharge = 0;
        const isLateCheckout = today > originalCheckOut;

        if (isLateCheckout && data?.applyLateFee) {
            extraCharge = Number(reservation.ratePerNight);
        }

        if (isLateCheckout && !data?.forceLateCheckout && !data?.applyLateFee) {
            return {
                requiresConfirmation: true,
                message: 'El check-out es después de la fecha programada. ¿Desea aplicar cargo por late check-out?',
                originalCheckOut: reservation.checkOut,
                currentDate: today,
                suggestedCharge: extraCharge
            };
        }

        await this.reservationRepo.update(id, { 
            status: ReservationStatus.CHECKED_OUT,
            totalAmount: Number(reservation.totalAmount) + extraCharge,
            actualCheckOutTime: new Date(),
            checkInNotes: data?.notes
        });
        await this.roomRepo.update(reservation.room.id, { status: RoomStatus.CLEANING });

        // Auto-crear solicitud de limpieza por check-out
        await this.cleaningRepo.save({
            companyId: reservation.room?.companyId || reservation.companyId,
            roomId: reservation.room.id,
            scheduledDate: new Date(),
            scheduledTime: new Date().toTimeString().slice(0, 5),
            type: CleaningType.TURNOVER,
            status: CleaningStatus.PENDING,
            notes: `Check-out automático - Reserva ${reservation.reservationNumber}`
        });

        return this.getReservation(id);
    }

    async cancelReservation(id: string) {
        const reservation = await this.reservationRepo.findOne({ where: { id } });
        if (!reservation) throw new Error('Reserva no encontrada');
        if (reservation.status === ReservationStatus.CHECKED_IN) {
            await this.roomRepo.update(reservation.room.id, { status: RoomStatus.AVAILABLE });
        }
        await this.reservationRepo.update(id, { status: ReservationStatus.CANCELLED });
        return this.getReservation(id);
    }

    async confirmReservation(id: string) {
        const reservation = await this.reservationRepo.findOne({ where: { id } });
        if (!reservation) throw new Error('Reserva no encontrada');
        if (reservation.status !== ReservationStatus.PENDING) {
            throw new Error('Solo se pueden confirmar reservas pendientes');
        }
        await this.reservationRepo.update(id, { status: ReservationStatus.CONFIRMED });
        return this.getReservation(id);
    }

    async moveReservation(id: string, data: { roomId?: string; checkIn?: string; checkOut?: string }) {
        const reservation = await this.reservationRepo.findOne({ where: { id }, relations: ['room'] });
        if (!reservation) throw new Error('Reserva no encontrada');

        const newRoomId = data.roomId || reservation.room.id;
        const newCheckIn = data.checkIn ? new Date(data.checkIn) : new Date(reservation.checkIn);
        const newCheckOut = data.checkOut ? new Date(data.checkOut) : new Date(reservation.checkOut);

        if (newCheckOut <= newCheckIn) {
            throw new Error('La fecha de check-out debe ser posterior a la de check-in');
        }

        if (data.roomId || (data.checkIn && data.checkOut)) {
            const conflicts = await this.reservationRepo
                .createQueryBuilder('r')
                .where('r.id != :id', { id })
                .andWhere('r.roomId = :roomId', { roomId: newRoomId })
                .andWhere('r.status NOT IN (:...excluded)', { excluded: [ReservationStatus.CANCELLED, ReservationStatus.NO_SHOW, ReservationStatus.CHECKED_OUT] })
                .andWhere('r.checkIn < :checkOut', { checkOut: newCheckOut })
                .andWhere('r.checkOut > :checkIn', { checkIn: newCheckIn })
                .getMany();

            if (conflicts.length > 0) {
                const conflict = conflicts[0];
                throw new Error(`La habitación no está disponible. Conflicto con reserva ${conflict.reservationNumber}`);
            }
        }

        const payload: any = {};
        if (data.roomId) payload.room = { id: data.roomId };
        if (data.checkIn) payload.checkIn = new Date(data.checkIn);
        if (data.checkOut) payload.checkOut = new Date(data.checkOut);

        if (data.checkIn && data.checkOut) {
            const nights = Math.ceil((newCheckOut.getTime() - newCheckIn.getTime()) / (1000 * 60 * 60 * 24));
            payload.totalAmount = Number(reservation.ratePerNight) * nights;
        }

        await this.reservationRepo.update(id, payload);
        return this.getReservation(id);
    }

    async checkAvailability(companyId: string, checkIn: string, checkOut: string, roomTypeId?: string) {
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);

        if (checkOutDate <= checkInDate) {
            throw new Error('La fecha de check-out debe ser posterior a la de check-in');
        }

        const roomWhere: any = { company: { id: companyId } };
        if (roomTypeId) roomWhere.roomType = { id: roomTypeId };
        
        const rooms = await this.roomRepo.find({
            where: roomWhere,
            relations: ['roomType']
        });

        const unavailableRoomIds = await this.reservationRepo
            .createQueryBuilder('r')
            .select('r.roomId')
            .where('r.companyId = :companyId', { companyId })
            .andWhere('r.status NOT IN (:...excluded)', { excluded: [ReservationStatus.CANCELLED, ReservationStatus.NO_SHOW, ReservationStatus.CHECKED_OUT] })
            .andWhere('r.checkIn < :checkOut', { checkOut: checkOutDate })
            .andWhere('r.checkOut > :checkIn', { checkIn: checkInDate })
            .getRawMany();

        const unavailableIds = new Set(unavailableRoomIds.map(r => r.r_roomId));

        const availableRooms = rooms
            .filter(r => !unavailableIds.has(r.id))
            .map(r => ({
                ...r,
                available: true
            }));

        return {
            checkIn,
            checkOut,
            roomTypeId,
            totalRooms: rooms.length,
            availableRooms: availableRooms.length,
            rooms: availableRooms
        };
    }

    // ─── REPORTS ──────────────────────────────────────────────
    async getOccupancyReport(companyId: string, start?: string, end?: string) {
        const startDate = start ? new Date(start) : new Date();
        startDate.setDate(1);
        const endDate = end ? new Date(end) : new Date();
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0);

        const reservations = await this.reservationRepo.find({
            where: {
                company: { id: companyId },
            },
            relations: ['room', 'room.roomType', 'guest']
        });

        const rooms = await this.roomRepo.find({
            where: { companyId },
            relations: ['roomType']
        });

        const totalRooms = rooms.length;
        const dateRange = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const roomNightsAvailable = totalRooms * dateRange;

        let occupiedNights = 0;
        let totalRevenue = 0;
        let cancelledRevenue = 0;
        const statusBreakdown: any = {};

        for (const r of reservations) {
            const ci = new Date(r.checkIn);
            const co = new Date(r.checkOut);
            
            if (r.status === ReservationStatus.CANCELLED || r.status === ReservationStatus.NO_SHOW) {
                cancelledRevenue += Number(r.totalAmount);
            } else if (ci >= startDate && co <= endDate) {
                const nights = Math.ceil((co.getTime() - ci.getTime()) / (1000 * 60 * 60 * 24));
                occupiedNights += nights;
                totalRevenue += Number(r.totalAmount);
            }

            statusBreakdown[r.status] = (statusBreakdown[r.status] || 0) + 1;
        }

        return {
            period: { start: startDate, end: endDate },
            totalRooms,
            roomNightsAvailable,
            occupiedNights,
            occupancyRate: roomNightsAvailable > 0 ? Math.round((occupiedNights / roomNightsAvailable) * 100) : 0,
            totalRevenue,
            cancelledRevenue,
            netRevenue: totalRevenue,
            statusBreakdown
        };
    }

    async getRevenueReport(companyId: string, start?: string, end?: string) {
        const startDate = start ? new Date(start) : new Date();
        startDate.setDate(1);
        const endDate = end ? new Date(end) : new Date();
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0);

        const reservations = await this.reservationRepo.find({
            where: {
                company: { id: companyId },
            },
            relations: ['room', 'room.roomType', 'guest']
        });

        let totalBooked = 0;
        let totalCancelled = 0;
        let totalCheckedIn = 0;
        let totalCheckedOut = 0;
        let noShow = 0;
        let pending = 0;
        let confirmed = 0;
        let revenueBySource: any = {};

        for (const r of reservations) {
            const ci = new Date(r.checkIn);
            const co = new Date(r.checkOut);
            
            if (ci >= startDate && co <= endDate) {
                switch (r.status) {
                    case ReservationStatus.PENDING:
                        pending++;
                        totalBooked += Number(r.totalAmount);
                        break;
                    case ReservationStatus.CONFIRMED:
                        confirmed++;
                        totalBooked += Number(r.totalAmount);
                        break;
                    case ReservationStatus.CHECKED_IN:
                        totalCheckedIn++;
                        break;
                    case ReservationStatus.CHECKED_OUT:
                        totalCheckedOut++;
                        break;
                    case ReservationStatus.CANCELLED:
                    case ReservationStatus.NO_SHOW:
                        totalCancelled += Number(r.totalAmount);
                        noShow++;
                        break;
                }

                revenueBySource[r.source] = (revenueBySource[r.source] || 0) + Number(r.totalAmount);
            }
        }

        return {
            period: { start: startDate, end: endDate },
            bookings: pending + confirmed,
            checkedIn: totalCheckedIn,
            checkedOut: totalCheckedOut,
            cancelled: totalCancelled,
            noShow,
            totalBooked,
            totalCancelled,
            netRevenue: totalBooked - totalCancelled,
            revenueBySource
        };
    }

    async getDailyReport(companyId: string, dateStr?: string) {
        const date = dateStr ? new Date(dateStr) : new Date();
        const dateStr2 = date.toISOString().split('T')[0];

        const reservations = await this.reservationRepo.find({
            where: { company: { id: companyId } },
            relations: ['room', 'room.roomType', 'guest']
        });

        const arrivals = reservations.filter(r => {
            const ci = new Date(r.checkIn).toISOString().split('T')[0];
            return ci === dateStr2 && r.status === ReservationStatus.CONFIRMED;
        });

        const departures = reservations.filter(r => {
            const co = new Date(r.checkOut).toISOString().split('T')[0];
            return co === dateStr2 && r.status === ReservationStatus.CHECKED_IN;
        });

        const inHouse = reservations.filter(r => r.status === ReservationStatus.CHECKED_IN);

        return {
            date: dateStr2,
            arrivals: arrivals.length,
            arrivalsList: arrivals.map(r => ({
                reservationNumber: r.reservationNumber,
                guest: r.guest ? `${r.guest.firstName} ${r.guest.lastName}` : null,
                room: r.room?.number,
                checkOut: r.checkOut
            })),
            departures: departures.length,
            departuresList: departures.map(r => ({
                reservationNumber: r.reservationNumber,
                guest: r.guest ? `${r.guest.firstName} ${r.guest.lastName}` : null,
                room: r.room?.number,
                total: r.totalAmount
            })),
            inHouse: inHouse.length,
            inHouseList: inHouse.map(r => ({
                reservationNumber: r.reservationNumber,
                guest: r.guest ? `${r.guest.firstName} ${r.guest.lastName}` : null,
                room: r.room?.number
            }))
        };
    }

    async getGuestHistory(companyId: string, guestId?: string) {
        const where: any = { company: { id: companyId } };
        if (guestId) where.guestId = guestId;

        const reservations = await this.reservationRepo.find({
            where: where,
            relations: ['room', 'room.roomType', 'guest'],
            order: { checkIn: 'DESC' }
        });

        return reservations.map(r => ({
            id: r.id,
            reservationNumber: r.reservationNumber,
            checkIn: r.checkIn,
            checkOut: r.checkOut,
            room: r.room?.number,
            roomType: r.room?.roomType?.name,
            guest: r.guest ? `${r.guest.firstName} ${r.guest.lastName}` : null,
            status: r.status,
            totalAmount: r.totalAmount,
            nights: Math.ceil((new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime()) / (1000 * 60 * 60 * 24))
        }));
    }

    async getReservationsForCalendar(companyId: string, start?: string, end?: string) {
        const reservations = await this.reservationRepo.find({
            where: {
                company: { id: companyId },
            },
            relations: ['room', 'room.roomType', 'guest'],
            order: { checkIn: 'ASC' }
        });

        const filtered = reservations.filter(r => 
            r.status !== ReservationStatus.CANCELLED && 
            r.status !== ReservationStatus.NO_SHOW
        );

        if (start && end) {
            const startDate = new Date(start);
            const endDate = new Date(end);
            return filtered.filter(r => {
                const ci = new Date(r.checkIn);
                const co = new Date(r.checkOut);
                return ci <= endDate && co >= startDate;
            });
        }
        return filtered;
    }

    // ─── INVOICES ───────────────────────────────────────────
    async getInvoices(companyId: string, status?: string) {
        const qb = this.invoiceRepo.createQueryBuilder('invoice')
            .leftJoinAndSelect('invoice.guest', 'guest')
            .leftJoinAndSelect('invoice.reservation', 'reservation')
            .where('invoice.companyId = :companyId', { companyId })
            .orderBy('invoice.issueDate', 'DESC');

        if (status) {
            qb.andWhere('invoice.status = :status', { status });
        }
        return qb.getMany();
    }

    async getInvoiceById(id: string) {
        return this.invoiceRepo.findOne({
            where: { id },
            relations: ['guest', 'reservation', 'reservation.room']
        });
    }

    async createInvoice(companyId: string, data: any) {
        const invoiceNumber = await this.generateInvoiceNumber(companyId);
        const subtotal = Number(data.subtotal) || 0;
        const tax = Number(data.tax) || 0;
        const discount = Number(data.discount) || 0;
        const paidAmount = Number(data.paidAmount) || 0;
        const total = subtotal + tax - discount;
        const pendingAmount = total - paidAmount;

        const invoice = this.invoiceRepo.create({
            invoiceNumber,
            companyId,
            reservationId: data.reservationId,
            guestId: data.guestId,
            issueDate: data.issueDate || new Date(),
            dueDate: data.dueDate,
            subtotal,
            tax,
            discount,
            total,
            paidAmount,
            pendingAmount,
            status: pendingAmount === 0 ? InvoiceStatus.PAID : pendingAmount < total ? InvoiceStatus.PARTIAL : InvoiceStatus.DRAFT,
            type: data.type || InvoiceType.ACCOMMODATION,
            notes: data.notes,
            paymentMethod: data.paymentMethod,
        });

        return this.invoiceRepo.save(invoice);
    }

    async generateInvoiceNumber(companyId: string): Promise<string> {
        const year = new Date().getFullYear();
        const count = await this.invoiceRepo.count({
            where: { company: { id: companyId } }
        });
        return `INV-${year}-${String(count + 1).padStart(5, '0')}`;
    }

    async recordPayment(id: string, amount: number, method: string) {
        const invoice = await this.invoiceRepo.findOne({
            where: { id }
        });
        if (!invoice) throw new Error('Factura no encontrada');

        invoice.paidAmount = Number(invoice.paidAmount) + amount;
        invoice.pendingAmount = Number(invoice.total) - invoice.paidAmount;
        invoice.paymentMethod = method;

        if (invoice.pendingAmount <= 0) {
            invoice.status = InvoiceStatus.PAID;
            invoice.pendingAmount = 0;
        } else {
            invoice.status = InvoiceStatus.PARTIAL;
        }

        return this.invoiceRepo.save(invoice);
    }

    async cancelInvoice(id: string) {
        const invoice = await this.invoiceRepo.findOne({
            where: { id }
        });
        if (!invoice) throw new Error('Factura no encontrada');

        invoice.status = InvoiceStatus.CANCELLED;
        return this.invoiceRepo.save(invoice);
    }

    async generateInvoiceFromReservation(reservationId: string) {
        const reservation = await this.reservationRepo.findOne({
            where: { id: reservationId },
            relations: ['room', 'room.roomType', 'guest']
        });
        if (!reservation) throw new Error('Reserva no encontrada');

        const nights = Math.ceil(
            (new Date(reservation.checkOut).getTime() - new Date(reservation.checkIn).getTime()) / (1000 * 60 * 60 * 24)
        );
        const roomPrice = Number(reservation.totalAmount || 0);
        const taxRate = 0.19;
        const subtotal = roomPrice;
        const tax = Math.round(subtotal * taxRate * 100) / 100;
        const total = subtotal + tax;

        const companyId = reservation.company?.id;

        return this.createInvoice(companyId, {
            reservationId: reservation.id,
            guestId: reservation.guest?.id,
            subtotal,
            tax,
            total,
            paidAmount: Number(reservation.paidAmount) || 0,
            type: InvoiceType.ACCOMMODATION,
            notes: `Habitación: ${reservation.room?.name || 'N/A'}. ${nights} noches.`,
        });
    }

    // ─── HOUSEKEEPING ────────────────────────────────────────
    async getCleaningRequests(companyId: string, status?: string, date?: string) {
        const qb = this.cleaningRepo.createQueryBuilder('req')
            .leftJoinAndSelect('req.room', 'room')
            .leftJoinAndSelect('room.roomType', 'roomType')
            .where('req.companyId = :companyId', { companyId });

        if (status) {
            qb.andWhere('req.status = :status', { status });
        }
        if (date) {
            qb.andWhere('req.scheduledDate = :date', { date });
        }
        return qb.orderBy('req.isUrgent', 'DESC').addOrderBy('req.scheduledDate', 'ASC').getMany();
    }

    async getCleaningStats(companyId: string) {
        const pending = await this.cleaningRepo.count({
            where: { companyId, status: CleaningStatus.PENDING }
        });
        const in_progress = await this.cleaningRepo.count({
            where: { companyId, status: CleaningStatus.IN_PROGRESS }
        });
        
        const completed = await this.cleaningRepo.createQueryBuilder('req')
            .where('req.companyId = :companyId', { companyId })
            .andWhere('req.status = :status', { status: CleaningStatus.COMPLETED })
            .andWhere('req.completedDate = CURRENT_DATE')
            .getCount();

        const verified = await this.cleaningRepo.createQueryBuilder('req')
            .where('req.companyId = :companyId', { companyId })
            .andWhere('req.status = :status', { status: CleaningStatus.VERIFIED })
            .andWhere('req.verifiedAt >= CURRENT_DATE')
            .getCount();

        return { pending, in_progress, completed, verified, total: pending + in_progress };
    }

    async createCleaningRequest(companyId: string, data: any) {
        const request = this.cleaningRepo.create({
            companyId,
            roomId: data.roomId,
            scheduledDate: data.scheduledDate || new Date(),
            scheduledTime: data.scheduledTime,
            type: data.type || CleaningType.STANDARD,
            isUrgent: data.isUrgent || false,
            notes: data.notes,
        });
        return this.cleaningRepo.save(request);
    }

    async updateCleaningRequest(id: string, data: any) {
        const req = await this.cleaningRepo.findOne({ where: { id } });
        if (!req) throw new Error('Solicitud no encontrada');

        if (data.status === CleaningStatus.IN_PROGRESS && !req.startedAt) {
            req.startedAt = new Date();
            if (!req.scheduledTime) req.scheduledTime = new Date().toTimeString().slice(0, 5);
        }
        if (data.status === CleaningStatus.COMPLETED) {
            const now = new Date();
            req.completedDate = now;
            req.completedTime = now.toTimeString().slice(0, 5);
            
            // Procesar cargos de minibar si existen
            if (data.minibarConsumptions && data.minibarConsumptions.length > 0) {
                try {
                    const reservation = await this.reservationRepo.findOne({
                        where: { roomId: req.roomId, status: ReservationStatus.CHECKED_IN },
                        relations: ['room']
                    });

                    if (reservation) {
                        for (const item of data.minibarConsumptions) {
                            await this.addCharge(reservation.id, `Minibar: ${item.name} (x${item.quantity})`, Number(item.price) * item.quantity);
                        }
                    }
                } catch (e) {
                    console.error('Error posteando cargos de minibar:', e);
                }
            }
        }
        if (data.status === CleaningStatus.VERIFIED) {
            req.verifiedAt = new Date();
        }

        Object.assign(req, data);
        return this.cleaningRepo.save(req);
    }

    async deleteCleaningRequest(id: string) {
        const req = await this.cleaningRepo.findOne({ where: { id } });
        if (!req) throw new Error('Solicitud no encontrada');
        if (req.status !== CleaningStatus.PENDING) {
            throw new Error('Solo se pueden eliminar solicitudes pendientes');
        }
        await this.cleaningRepo.remove(req);
        return { deleted: true };
    }

    async startCleaning(id: string, assignedTo: string) {
        return this.updateCleaningRequest(id, { status: CleaningStatus.IN_PROGRESS, assignedTo });
    }

    async completeCleaning(id: string) {
        return this.updateCleaningRequest(id, { status: CleaningStatus.COMPLETED });
    }

    async verifyCleaning(id: string, staffId: string) {
        const request = await this.cleaningRepo.findOne({ where: { id } });
        if (!request) throw new Error('Solicitud no encontrada');

        const staff = await this.staffRepo.findOne({ where: { id: staffId } });
        await this.cleaningRepo.update(id, { status: CleaningStatus.VERIFIED, verifiedBy: staff?.name, supervisorId: staffId });
        await this.roomRepo.update(request.roomId, { status: RoomStatus.AVAILABLE });
        return this.cleaningRepo.findOne({ where: { id } });
    }

    async syncCleaningRequests(companyId: string) {
        const cleaningRooms = await this.roomRepo.find({
            where: { companyId, status: RoomStatus.CLEANING }
        });

        const existingRequests = await this.cleaningRepo.find({
            where: { companyId, status: In([CleaningStatus.PENDING, CleaningStatus.IN_PROGRESS, CleaningStatus.COMPLETED]) }
        });
        const existingRoomIds = new Set(existingRequests.map(r => r.roomId));

        let created = 0;
        for (const room of cleaningRooms) {
            if (!existingRoomIds.has(room.id)) {
                await this.cleaningRepo.save({
                    companyId,
                    roomId: room.id,
                    scheduledDate: new Date(),
                    scheduledTime: new Date().toTimeString().slice(0, 5),
                    type: CleaningType.TURNOVER,
                    status: CleaningStatus.PENDING,
                    notes: 'Sincronización automática - Habitación en limpieza'
                });
                created++;
            }
        }

        return { synced: created, totalCleaningRooms: cleaningRooms.length };
    }

    // ─── HOUSEKEEPING STAFF ─────────────────────────────────
    async getCleaningStaffByRole(companyId: string) {
        return this.staffRepo.find({
            where: { companyId, isActive: true },
            order: { role: 'ASC', name: 'ASC' }
        });
    }

    async createCleaningStaff(companyId: string, data: any) {
        const staff = this.staffRepo.create({ ...data, companyId });
        return this.staffRepo.save(staff);
    }

    async updateCleaningStaff(id: string, data: any) {
        await this.staffRepo.update(id, data);
        return this.staffRepo.findOne({ where: { id } });
    }

    async deleteCleaningStaff(id: string) {
        await this.staffRepo.update(id, { isActive: false });
        return { deleted: true };
    }

    async assignCleaningRequest(requestId: string, staffId: string, isSupervisor: boolean = false) {
        if (isSupervisor) {
            const staff = await this.staffRepo.findOne({ where: { id: staffId } });
            const request = await this.cleaningRepo.findOne({ where: { id: requestId } });
            await this.cleaningRepo.update(requestId, { 
                status: CleaningStatus.VERIFIED, 
                verifiedBy: staff?.name, 
                supervisorId: staffId 
            });
            if (request?.roomId) {
                await this.roomRepo.update(request.roomId, { status: RoomStatus.AVAILABLE });
            }
            return this.cleaningRepo.findOne({ where: { id: requestId } });
        }
        
        const staff = await this.staffRepo.findOne({ where: { id: staffId } });
        const updates = { assignedToId: staffId, assignedTo: staff?.name, status: CleaningStatus.IN_PROGRESS };
        await this.cleaningRepo.update(requestId, updates);
        return this.cleaningRepo.findOne({ where: { id: requestId } });
    }

    // ─── MAINTENANCE ───────────────────────────────────────────
    async getMaintenanceRequests(companyId: string, status?: string) {
        const qb = this.maintenanceRepo.createQueryBuilder('req')
            .leftJoinAndSelect('req.room', 'room')
            .leftJoinAndSelect('room.roomType', 'roomType')
            .where('req.companyId = :companyId', { companyId });

        if (status) {
            qb.andWhere('req.status = :status', { status });
        }
        return qb.orderBy('req.priority', 'DESC').addOrderBy('req.requestedDate', 'ASC').getMany();
    }

    async getMaintenanceStats(companyId: string) {
        const pending = await this.maintenanceRepo.count({ where: { companyId, status: MaintenanceStatus.PENDING } });
        const inProgress = await this.maintenanceRepo.count({ where: { companyId, status: MaintenanceStatus.IN_PROGRESS } });
        const completed = await this.maintenanceRepo.count({ where: { companyId, status: MaintenanceStatus.COMPLETED } });
        const verified = await this.maintenanceRepo.count({ where: { companyId, status: MaintenanceStatus.VERIFIED } });

        return { 
            pending, 
            in_progress: inProgress, 
            completed, 
            verified, 
            total: pending + inProgress 
        };
    }

    async createMaintenanceRequest(companyId: string, data: any) {
        const room = await this.roomRepo.findOne({ where: { id: data.roomId } });
        
        if (data.roomId && room?.status === RoomStatus.AVAILABLE) {
            await this.roomRepo.update(data.roomId, { status: RoomStatus.MAINTENANCE });
        }

        const request = this.maintenanceRepo.create({
            ...data,
            companyId,
            requestedDate: data.requestedDate || new Date(),
            status: MaintenanceStatus.PENDING,
        });
        return this.maintenanceRepo.save(request);
    }

    async updateMaintenanceRequest(id: string, data: any) {
        const req = await this.maintenanceRepo.findOne({ where: { id } });
        if (!req) throw new Error('Solicitud no encontrada');
        Object.assign(req, data);
        return this.maintenanceRepo.save(req);
    }

    async deleteMaintenanceRequest(id: string) {
        const req = await this.maintenanceRepo.findOne({ where: { id } });
        if (!req) throw new Error('Solicitud no encontrada');
        if (req.status !== MaintenanceStatus.PENDING) {
            throw new Error('Solo se pueden eliminar solicitudes pendientes');
        }
        if (req.roomId) {
            await this.roomRepo.update(req.roomId, { status: RoomStatus.AVAILABLE });
        }
        await this.maintenanceRepo.remove(req);
        return { deleted: true };
    }

    async assignMaintenanceRequest(id: string, staffId: string, isSupervisor: boolean = false) {
        const staff = await this.maintenanceStaffRepo.findOne({ where: { id: staffId } });
        const request = await this.maintenanceRepo.findOne({ where: { id } });

        if (isSupervisor && request) {
            await this.maintenanceRepo.update(id, { 
                status: MaintenanceStatus.VERIFIED,
                verifiedBy: staff?.name,
                verifiedAt: new Date()
            });
            if (request.roomId) {
                await this.roomRepo.update(request.roomId, { status: RoomStatus.AVAILABLE });
            }
            return this.maintenanceRepo.findOne({ where: { id } });
        }

        if (request?.roomId && request.status === MaintenanceStatus.PENDING) {
            await this.roomRepo.update(request.roomId, { status: RoomStatus.MAINTENANCE });
        }

        await this.maintenanceRepo.update(id, { 
            assignedToId: staffId, 
            assignedTo: staff?.name, 
            status: MaintenanceStatus.IN_PROGRESS 
        });
        return this.maintenanceRepo.findOne({ where: { id } });
    }

    async completeMaintenance(id: string) {
        const request = await this.maintenanceRepo.findOne({ where: { id } });
        if (!request) throw new Error('Solicitud no encontrada');

        await this.maintenanceRepo.update(id, { 
            status: MaintenanceStatus.COMPLETED,
            completedAt: new Date()
        });
        return this.maintenanceRepo.findOne({ where: { id } });
    }

    async syncMaintenanceRequests(companyId: string) {
        const maintenanceRooms = await this.roomRepo.find({
            where: { companyId, status: RoomStatus.MAINTENANCE }
        });

        const existingRequests = await this.maintenanceRepo.find({
            where: { companyId, status: In([MaintenanceStatus.PENDING, MaintenanceStatus.IN_PROGRESS, MaintenanceStatus.COMPLETED]) }
        });
        const existingRoomIds = new Set(existingRequests.map(r => r.roomId));

        let created = 0;
        for (const room of maintenanceRooms) {
            if (!existingRoomIds.has(room.id)) {
                await this.maintenanceRepo.save({
                    companyId,
                    roomId: room.id,
                    requestedDate: new Date(),
                    priority: MaintenancePriority.MEDIUM,
                    issue: 'Sincronización automática',
                    status: MaintenanceStatus.PENDING
                });
                created++;
            }
        }

        return { synced: created, totalMaintenanceRooms: maintenanceRooms.length };
    }

    // ─── MAINTENANCE STAFF ────────────────────────────────
    async getMaintenanceStaff(companyId: string) {
        return this.maintenanceStaffRepo.find({
            where: { companyId, isActive: true },
            order: { role: 'ASC', name: 'ASC' }
        });
    }

    async createMaintenanceStaff(companyId: string, data: any) {
        const staff = this.maintenanceStaffRepo.create({ ...data, companyId });
        return this.maintenanceStaffRepo.save(staff);
    }

    async updateMaintenanceStaff(id: string, data: any) {
        await this.maintenanceStaffRepo.update(id, data);
        return this.maintenanceStaffRepo.findOne({ where: { id } });
    }

    async deleteMaintenanceStaff(id: string) {
        await this.maintenanceStaffRepo.update(id, { isActive: false });
        return { deleted: true };
    }

    // ─── RESTAURANT TABLES ────────────────────────────────
    async getRestaurantTables(companyId: string) {
        return this.tableRepo.find({
            where: { companyId, isActive: true },
            order: { tableNumber: 'ASC' }
        });
    }

    async createRestaurantTable(companyId: string, data: any) {
        const table = this.tableRepo.create({ ...data, companyId, isActive: true });
        return this.tableRepo.save(table);
    }

    async updateRestaurantTable(id: string, data: any) {
        await this.tableRepo.update(id, data);
        return this.tableRepo.findOne({ where: { id } });
    }

    async deleteRestaurantTable(id: string) {
        await this.tableRepo.update(id, { isActive: false });
        return { deleted: true };
    }

    // ─── MENU CATEGORIES ────────────────────────────────
    async getMenuCategories(companyId: string) {
        return this.categoryRepo.find({
            where: { companyId, isActive: true },
            order: { order: 'ASC' }
        });
    }

    async createMenuCategory(companyId: string, data: any) {
        const category = this.categoryRepo.create({ ...data, companyId, isActive: true });
        return this.categoryRepo.save(category);
    }

    async updateMenuCategory(id: string, data: any) {
        await this.categoryRepo.update(id, data);
        return this.categoryRepo.findOne({ where: { id } });
    }

    // ─── MENU ITEMS ────────────────────────────────
    async getMenuItems(companyId: string, categoryId?: string) {
        const where: any = { companyId, isActive: true };
        if (categoryId) where.categoryId = categoryId;
        return this.menuItemRepo.find({
            where,
            relations: ['category'],
            order: { name: 'ASC' }
        });
    }

    async createMenuItem(companyId: string, data: any) {
        const item = this.menuItemRepo.create({ ...data, companyId, isActive: true });
        return this.menuItemRepo.save(item);
    }

    async updateMenuItem(id: string, data: any) {
        await this.menuItemRepo.update(id, data);
        return this.menuItemRepo.findOne({ where: { id } });
    }

    // ─── RESTAURANT ORDERS ────────────────────────────────
    async getRestaurantOrders(companyId: string, status?: string) {
        const where: any = { companyId };
        if (status) where.status = status;
        return this.orderRepo.find({
            where,
            relations: ['table', 'guest'],
            order: { createdAt: 'DESC' }
        });
    }

    async createRestaurantOrder(companyId: string, data: any) {
        const count = await this.orderRepo.count({ where: { company: { id: companyId } } });
        const orderNumber = `ORD-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
        
        const items = JSON.stringify(data.items || []);
        
        const subtotal = data.subtotal || 0;
        const taxRate = 0.19;
        const taxAmount = Math.round(subtotal * taxRate);
        const tipPercentage = data.tipPercentage || 10;
        const tipAmount = Math.round(subtotal * (tipPercentage / 100));
        const discount = data.discount || 0;
        const total = subtotal + taxAmount + tipAmount - discount;

        const order = this.orderRepo.create({
            ...data,
            orderNumber,
            companyId,
            items,
            subtotal,
            taxRate,
            taxAmount,
            tipPercentage,
            tipAmount,
            discount,
            total,
            status: OrderStatus.PENDING
        });

        if (data.tableId) {
            await this.tableRepo.update(data.tableId, { status: TableStatus.OCCUPIED });
        }

        return this.orderRepo.save(order);
    }

    async updateRestaurantOrder(id: string, data: any) {
        const order = await this.orderRepo.findOne({ where: { id } });
        if (!order) throw new Error('Pedido no encontrado');
        
        if (data.status === OrderStatus.COMPLETED && order.status !== OrderStatus.COMPLETED) {
            await this.orderRepo.update(id, { status: data.status, completedAt: new Date() });
            if (order.tableId) {
                await this.tableRepo.update(order.tableId, { status: TableStatus.CLEANING });
            }
            return this.orderRepo.findOne({ where: { id } });
        }

        if (data.status === OrderStatus.PAID) {
            const paymentMethod = data.paymentMethod || PaymentMethod.CASH;
            const cashReceived = Number(data.cashReceived || 0);
            const change = cashReceived - Number(order.total);
            
            await this.orderRepo.update(id, { 
                status: data.status,
                paymentMethod,
                cashReceived,
                change: change > 0 ? change : 0
            });
            
            if (order.tableId) {
                await this.tableRepo.update(order.tableId, { status: TableStatus.AVAILABLE });
            }

            // TODO: Integrar con accounting - requiere userId
            /*
            try {
                const companyId = order.companyId;
                const paymentAccount = paymentMethod === PaymentMethod.CASH || paymentMethod === 'EFECTIVO' ? '110505' : '110510';
                const entries = [
                    { accountId: paymentAccount, debit: Number(order.total), credit: 0, description: `Venta restaurant - ${order.orderNumber}` },
                    { accountId: '430505', debit: 0, credit: Number(order.subtotal), description: `Ingreso restaurant - ${order.orderNumber}` },
                    { accountId: '240805', debit: 0, credit: Number(order.taxAmount), description: `IVA restaurant - ${order.orderNumber}` },
                    { accountId: '240805', debit: Number(order.tipAmount) * 0.19, credit: 0, description: `IVA propina - ${order.orderNumber}` },
                    { accountId: '430595', debit: 0, credit: Number(order.tipAmount) * 0.81, description: `Propina restaurante - ${order.orderNumber}` },
                ];

                await this.accountingService.createVoucher({
                    number: `REST-${order.orderNumber.replace('ORD-', '')}`,
                    date: new Date(),
                    description: `Pago orden restaurant ${order.orderNumber}`,
                    type: 'INGRESO',
                    entries: entries.filter(e => e.debit > 0 || e.credit > 0)
                }, '');
            } catch (err) {
                console.error('Error creating accounting entry for restaurant order:', err);
            }
            */

            return this.orderRepo.findOne({ where: { id } });
        }

        if (data.status === OrderStatus.CANCELLED) {
            await this.orderRepo.update(id, { status: data.status });
            if (order.tableId) {
                await this.tableRepo.update(order.tableId, { status: TableStatus.AVAILABLE });
            }
            return this.orderRepo.findOne({ where: { id } });
        }

        await this.orderRepo.update(id, data);
        return this.orderRepo.findOne({ where: { id } });
    }

    async getRestaurantStats(companyId: string) {
        const pending = await this.orderRepo.count({ where: { companyId, status: OrderStatus.PENDING } });
        const inProgress = await this.orderRepo.count({ where: { companyId, status: OrderStatus.IN_PROGRESS } });
        const completed = await this.orderRepo.count({ where: { companyId, status: OrderStatus.COMPLETED } });
        const paid = await this.orderRepo.count({ where: { companyId, status: OrderStatus.PAID } });
        const cancelled = await this.orderRepo.count({ where: { companyId, status: OrderStatus.CANCELLED } });

        const paidOrders = await this.orderRepo.find({ where: { companyId, status: OrderStatus.PAID } });
        const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
        const totalTips = paidOrders.reduce((sum, o) => sum + Number(o.tipAmount || 0), 0);

        return { pending, inProgress, completed, paid, cancelled, totalRevenue, totalTips };
    }

    async getRestaurantOrderById(id: string) {
        return this.orderRepo.findOne({ 
            where: { id },
            relations: ['table', 'company']
        });
    }

    async getRestaurantOrderPrint(id: string) {
        const order = await this.orderRepo.findOne({ 
            where: { id },
            relations: ['table', 'company']
        });
        
        if (!order) throw new Error('Pedido no encontrado');
        
        const items = JSON.parse(order.items || '[]');
        
        const company = order.company;
        const printData = {
            header: {
                name: company?.name || 'RESTAURANTE',
                nit: company?.nit || 'N/A',
                address: company?.address || '',
                phone: company?.phone || ''
            },
            order: {
                number: order.orderNumber,
                date: order.createdAt,
                table: order.table?.tableNumber || 'N/A'
            },
            items: items.map((item: any) => ({
                quantity: item.quantity,
                name: item.name,
                price: item.price,
                total: item.price * item.quantity
            })),
            totals: {
                subtotal: order.subtotal,
                taxAmount: order.taxAmount,
                taxRate: order.taxRate,
                tipPercentage: order.tipPercentage,
                tipAmount: order.tipAmount,
                discount: order.discount,
                total: order.total
            },
            payment: {
                method: order.paymentMethod,
                cashReceived: order.cashReceived,
                change: order.change
            }
        };
        
        return printData;
    }

    // ─── GLOBAL SEARCH ─────────────────────────────────
async globalSearch(companyId: string, q: string) {
        const query = `%${q}%`;
        const searchLower = q.toLowerCase();
        
        const guests = await this.guestRepo.find({
            where: [
                { firstName: ILike(query) },
                { lastName: ILike(query) },
                { email: ILike(query) },
                { phone: ILike(query) },
            ],
            take: 20
        });

        const allReservations = await this.reservationRepo.find({
            where: { companyId },
            relations: ['guest', 'room'],
            take: 100
        });

        const matchedReservations = allReservations.filter(r => 
            r.reservationNumber.toLowerCase().includes(searchLower) ||
            (r.guest && r.guest.firstName?.toLowerCase().includes(searchLower)) ||
            (r.guest && r.guest.lastName?.toLowerCase().includes(searchLower))
        );

        return { guests, reservations: matchedReservations };
    }

    // ─── WALK-IN ────────────────────────────────────────
    async createWalkIn(companyId: string, data: any) {
        const { guest, reservation } = data;
        
        let guestEntity: Guest | null = null;
        if (guest.email) {
            guestEntity = await this.guestRepo.findOne({ where: { email: guest.email } });
        }
        if (!guestEntity && guest.firstName) {
            const newGuest = new Guest();
            newGuest.firstName = guest.firstName;
            newGuest.lastName = guest.lastName || '';
            newGuest.email = guest.email || '';
            newGuest.phone = guest.phone || '';
            newGuest.docType = guest.docType || 'CC';
            newGuest.docNumber = guest.docNumber || '';
            newGuest.company = { id: companyId } as any;
            guestEntity = await this.guestRepo.save(newGuest);
        }
        if (!guestEntity) throw new Error('Error al crear huésped');

        const rate = await this.calculateRate(reservation.roomTypeId, new Date(reservation.checkIn), new Date(reservation.checkOut), reservation.adults || 1, reservation.children || 0);
        
        const newReservation = this.reservationRepo.create({
            ...reservation,
            guestId: guestEntity.id,
            reservationNumber: `WI-${Date.now()}`,
            source: 'WALK_IN',
            status: ReservationStatus.PENDING,
            totalAmount: rate.totalRate,
            companyId,
            adults: reservation.adults || 1,
            children: reservation.children || 0,
            ratePerNight: rate.nightlyRate
        });
        
        return this.reservationRepo.save(newReservation);
    }

    // ─── UNASSIGNED RESERVATIONS ────────────────────────────────
    async getUnassignedReservations(companyId: string) {
        return this.reservationRepo.find({
            where: { companyId, isUnassigned: true, status: ReservationStatus.PENDING },
            relations: ['guest'],
            order: { createdAt: 'DESC' }
        });
    }

    async assignRoom(reservationId: string, roomId: string) {
        const reservation = await this.reservationRepo.findOne({ where: { id: reservationId } });
        if (!reservation) throw new Error('Reserva no encontrada');
        
        reservation.roomId = roomId;
        reservation.isUnassigned = false;
        
        return this.reservationRepo.save(reservation);
    }

    // ─── ALERTS ────────────────────────────────────────
    async setAlert(reservationId: string, data: { hasRedAlert?: boolean; hasYellowAlert?: boolean; alertMessage?: string }) {
        const reservation = await this.reservationRepo.findOne({ where: { id: reservationId } });
        if (!reservation) throw new Error('Reserva no encontrada');
        
        reservation.hasRedAlert = data.hasRedAlert || false;
        reservation.hasYellowAlert = data.hasYellowAlert || false;
        if (data.alertMessage !== undefined) {
            reservation.alertMessage = data.alertMessage;
        }
        
        return this.reservationRepo.save(reservation);
    }

    async extendStay(reservationId: string, additionalDays: number) {
        const reservation = await this.reservationRepo.findOne({ where: { id: reservationId }, relations: ['room'] });
        if (!reservation) throw new Error('Reserva no encontrada');
        
        const currentCheckOut = new Date(reservation.checkOut);
        currentCheckOut.setDate(currentCheckOut.getDate() + additionalDays);
        reservation.checkOut = currentCheckOut;
        
        return this.reservationRepo.save(reservation);
    }

    async addCharge(reservationId: string, description: string, amount: number) {
        const reservation = await this.reservationRepo.findOne({ where: { id: reservationId } });
        if (!reservation) throw new Error('Reserva no encontrada');
        
        const invoice = this.invoiceRepo.create({
            invoiceNumber: `INV-${Date.now()}`,
            reservationId: reservation.id,
            companyId: reservation.companyId,
            issueDate: new Date(),
            subtotal: amount,
            tax: 0,
            discount: 0,
            total: amount,
            paidAmount: 0,
            pendingAmount: amount,
            status: InvoiceStatus.DRAFT,
            type: InvoiceType.SERVICE,
            notes: description
        });
        await this.invoiceRepo.save(invoice);
        
        return invoice;
    }

    // ─── CASH DRAWER ─────────────────────────────────
    async getOpenDrawer(companyId: string) {
        return this.drawerRepo.findOne({
            where: { companyId, status: DrawerStatus.OPEN },
            order: { openedAt: 'DESC' }
        });
    }

    async openCashDrawer(companyId: string, openingAmount: number, userId: string) {
        const openDrawer = await this.getOpenDrawer(companyId);
        if (openDrawer) throw new Error('Ya hay una caja abierta');
        
        const drawer = this.drawerRepo.create({
            drawerNumber: `DRW-${Date.now()}`,
            openingAmount,
            expectedAmount: openingAmount,
            actualAmount: openingAmount,
            status: DrawerStatus.OPEN,
            auditType: AuditType.SHIFT,
            openedById: userId,
            openedAt: new Date(),
            companyId
        });
        
        return this.drawerRepo.save(drawer);
    }

    async closeCashDrawer(companyId: string, actualAmount: number, notes: string, userId: string) {
        const drawer = await this.getOpenDrawer(companyId);
        if (!drawer) throw new Error('No hay caja abierta');
        
        drawer.actualAmount = actualAmount;
        drawer.difference = actualAmount - drawer.expectedAmount;
        drawer.status = DrawerStatus.CLOSED;
        drawer.closedAt = new Date();
        drawer.closedById = userId;
        drawer.notes = notes;
        
        return this.drawerRepo.save(drawer);
    }

    async addDrawerTransaction(companyId: string, data: any, userId: string) {
        const drawer = await this.getOpenDrawer(companyId);
        if (!drawer) throw new Error('No hay caja abierta');
        
        const transaction = this.drawerTransRepo.create({
            drawerId: drawer.id,
            type: data.type,
            amount: data.amount,
            paymentMethod: data.paymentMethod,
            description: data.description,
            reservationId: data.reservationId,
            invoiceId: data.invoiceId,
            createdById: userId
        });
        
        await this.drawerTransRepo.save(transaction);
        
        if (data.type === 'IN') {
            drawer.expectedAmount += data.amount;
        } else if (data.type === 'OUT') {
            drawer.expectedAmount -= data.amount;
        }
        
        await this.drawerRepo.save(drawer);
        
        return transaction;
    }

    async getDrawerTransactions(drawerId: string) {
        return this.drawerTransRepo.find({ where: { drawerId }, order: { createdAt: 'DESC' } });
    }

    async performAudit(companyId: string, auditType: string, actualAmount: number, notes: string, userId: string) {
        const drawer = await this.getOpenDrawer(companyId);
        if (!drawer) throw new Error('No hay caja abierta');
        
        drawer.actualAmount = actualAmount;
        drawer.difference = actualAmount - drawer.expectedAmount;
        drawer.status = DrawerStatus.AUDITED;
        drawer.notes = notes;
        
        await this.drawerRepo.save(drawer);
        
        const newDrawer = this.drawerRepo.create({
            drawerNumber: `DRW-${Date.now()}`,
            openingAmount: actualAmount,
            expectedAmount: actualAmount,
            actualAmount: actualAmount,
            status: DrawerStatus.OPEN,
            auditType: auditType as AuditType,
            openedById: userId,
            openedAt: new Date(),
            companyId
        });
        
        return this.drawerRepo.save(newDrawer);
    }

    // ─── PAYMENT SPLITS ────────────────────────────────
    async recordSplitPayment(invoiceId: string, splits: any[]) {
        const invoice = await this.invoiceRepo.findOne({ where: { id: invoiceId } });
        if (!invoice) throw new Error('Factura no encontrada');
        
        for (const split of splits) {
            const payment = this.splitRepo.create({
                invoiceId,
                reservationId: invoice.reservationId,
                amount: split.amount,
                paymentMethod: split.paymentMethod,
                reference: split.reference,
                isPreAuthorization: split.isPreAuth || false,
                cardLast4: split.cardLast4,
                companyId: invoice.companyId
            });
            
            await this.splitRepo.save(payment);
            
            invoice.paidAmount += split.amount;
        }
        
        if (invoice.paidAmount >= invoice.total) {
            invoice.status = InvoiceStatus.PAID;
        }
        
        return this.invoiceRepo.save(invoice);
    }

    async preAuthorizeCard(invoiceId: string, data: { amount: number; reference: string; cardLast4: string }) {
        const invoice = await this.invoiceRepo.findOne({ where: { id: invoiceId } });
        if (!invoice) throw new Error('Factura no encontrada');
        
        const payment = this.splitRepo.create({
            invoiceId,
            reservationId: invoice.reservationId,
            amount: data.amount,
            paymentMethod: 'CREDIT_ON_FILE',
            reference: data.reference,
            cardLast4: data.cardLast4,
            isPreAuthorization: true,
            companyId: invoice.companyId
        });
        
        return this.splitRepo.save(payment);
    }

    async capturePayment(paymentId: string) {
        const payment = await this.splitRepo.findOne({ where: { id: paymentId } });
        if (!payment) throw new Error('Pago no encontrado');
        if (!payment.isPreAuthorization) throw new Error('No es una pre-autorización');
        if (payment.isCaptured) throw new Error('Ya capturado');
        
        payment.isCaptured = true;
        payment.capturedAt = new Date();
        
        return this.splitRepo.save(payment);
    }

    async reversePayment(paymentId: string, reason: string) {
        const payment = await this.splitRepo.findOne({ where: { id: paymentId } });
        if (!payment) throw new Error('Pago no encontrado');
        
        payment.isReversed = true;
        payment.reversedAt = new Date();
        payment.reversalReason = reason;
        
        return this.splitRepo.save(payment);
    }

    // ─── DEPOSIT TRANSFERS ────────────────────────────
    async transferDeposit(companyId: string, data: { fromReservationId: string; toReservationId: string; amount: number; reason?: string }, userId: string) {
        const fromRes = await this.reservationRepo.findOne({ where: { id: data.fromReservationId } });
        const toRes = await this.reservationRepo.findOne({ where: { id: data.toReservationId } });
        
        if (!fromRes || !toRes) throw new Error('Reserva no encontrada');
        if (fromRes.paidAmount < data.amount) throw new Error('Depósito insuficiente');
        
        fromRes.paidAmount -= data.amount;
        toRes.paidAmount += data.amount;
        
        await this.reservationRepo.save(fromRes);
        await this.reservationRepo.save(toRes);
        
        const transfer = this.depositTransRepo.create({
            fromReservationId: data.fromReservationId,
            toReservationId: data.toReservationId,
            amount: data.amount,
            reason: data.reason,
            approvedBy: userId,
            companyId
        });
        
        return this.depositTransRepo.save(transfer);
    }

    // ─── SHARED INVENTORY ────────────────────────────
    async linkInventory(data: { primaryRoomTypeId: string; secondaryRoomTypeId: string; autoBlock?: boolean }) {
        const link = this.sharedInvRepo.create({
            primaryRoomTypeId: data.primaryRoomTypeId,
            secondaryRoomTypeId: data.secondaryRoomTypeId,
            autoBlock: data.autoBlock || false
        });
        
        return this.sharedInvRepo.save(link);
    }

    async checkSharedAvailability(companyId: string, checkIn: string, checkOut: string) {
        const links = await this.sharedInvRepo.find({ where: { isActive: true } });
        
        const result: { primaryRoomType: string; secondaryRoomType: string; totalInventory: number; available: number; autoBlockEnabled: boolean }[] = [];
        
        for (const link of links) {
            const primaryAvail = await this.checkAvailability(companyId, checkIn, checkOut, link.primaryRoomTypeId);
            const secondaryAvail = await this.checkAvailability(companyId, checkIn, checkOut, link.secondaryRoomTypeId);
            
            result.push({
                primaryRoomType: link.primaryRoomTypeId,
                secondaryRoomType: link.secondaryRoomTypeId,
                totalInventory: primaryAvail.totalRooms + secondaryAvail.totalRooms,
                available: primaryAvail.availableRooms + secondaryAvail.availableRooms,
                autoBlockEnabled: link.autoBlock
            });
        }
        
        return result;
    }
}
