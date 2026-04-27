import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { RoomType } from './src/modules/pms/entities/room-type.entity';
import { Room } from './src/modules/pms/entities/room.entity';
import { RoomRate } from './src/modules/pms/entities/room-rate.entity';
import { CancellationPolicy } from './src/modules/pms/entities/cancellation-policy.entity';
import { Guest, GuestDocType } from './src/modules/pms/entities/guest.entity';
import { Reservation, ReservationStatus, ReservationSource } from './src/modules/pms/entities/reservation.entity';

config();

const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5438'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'hotel_erp',
    entities: [
        RoomType, Room, RoomRate, CancellationPolicy, Guest, Reservation
    ],
    synchronize: true,
});

async function seed() {
    const companyId = 'demo-company-001';
    console.log(' Starting seed...');

    await dataSource.initialize();
    const em = dataSource.createEntityManager();

    const rt1 = await em.save(RoomType, { name: 'Estándar', basePrice: 80000, capacity: 2, companyId });
    const rt2 = await em.save(RoomType, { name: 'Suite', basePrice: 150000, capacity: 4, companyId });
    const rt3 = await em.save(RoomType, { name: 'Deluxe', basePrice: 120000, capacity: 3, companyId });
    const rt4 = await em.save(RoomType, { name: 'Familiar', basePrice: 200000, capacity: 6, companyId });
    console.log(' Created 4 room types');

    const r1 = await em.save(Room, { number: '101', floor: '1', roomTypeId: rt1.id, companyId });
    const r2 = await em.save(Room, { number: '102', floor: '1', roomTypeId: rt1.id, companyId });
    const r3 = await em.save(Room, { number: '103', floor: '1', roomTypeId: rt1.id, companyId });
    const r4 = await em.save(Room, { number: '201', floor: '2', roomTypeId: rt2.id, companyId });
    const r5 = await em.save(Room, { number: '202', floor: '2', roomTypeId: rt2.id, companyId });
    const r6 = await em.save(Room, { number: '301', floor: '3', roomTypeId: rt3.id, companyId });
    const r7 = await em.save(Room, { number: '302', floor: '3', roomTypeId: rt3.id, companyId });
    const r8 = await em.save(Room, { number: '401', floor: '4', roomTypeId: rt4.id, companyId });
    console.log(' Created 8 rooms');

    const today = new Date();
    const endOfYear = new Date(today.getFullYear(), 11, 31);
    await em.save(RoomRate, { roomTypeId: rt1.id, rateCode: 'STD', price: 80000, startDate: today, endDate: endOfYear, companyId });
    await em.save(RoomRate, { roomTypeId: rt2.id, rateCode: 'SUITE', price: 150000, startDate: today, endDate: endOfYear, companyId });
    await em.save(RoomRate, { roomTypeId: rt3.id, rateCode: 'DELUXE', price: 120000, startDate: today, endDate: endOfYear, companyId });
    await em.save(RoomRate, { roomTypeId: rt4.id, rateCode: 'FAM', price: 200000, startDate: today, endDate: endOfYear, companyId });
    console.log(' Created room rates');

    await em.save(CancellationPolicy, { name: 'Sin penalty', policyCode: 'FLEX', daysBeforeCheckIn: 7, penaltyPercentage: 0, isActive: true, companyId });
    await em.save(CancellationPolicy, { name: 'Moderada', policyCode: 'MOD', daysBeforeCheckIn: 3, penaltyPercentage: 30, isActive: true, companyId });
    await em.save(CancellationPolicy, { name: 'Estricta', policyCode: 'STR', daysBeforeCheckIn: 1, penaltyPercentage: 50, isActive: true, companyId });
    console.log(' Created cancellation policies');

    const g1 = await em.save(Guest, { firstName: 'Juan', lastName: 'Pérez', docType: GuestDocType.CC, docNumber: '12345678', email: 'juan@email.com', phone: '3001234567', companyId });
    const g2 = await em.save(Guest, { firstName: 'María', lastName: 'Gómez', docType: GuestDocType.CC, docNumber: '87654321', email: 'maria@email.com', phone: '3009876543', companyId });
    const g3 = await em.save(Guest, { firstName: 'Carlos', lastName: 'Rodríguez', docType: GuestDocType.CE, docNumber: '123456789', email: 'carlos@email.com', phone: '3005551234', nationality: 'Colombia', companyId });
    const g4 = await em.save(Guest, { firstName: 'Ana', lastName: 'Martínez', docType: GuestDocType.PASSPORT, docNumber: 'AB123456', email: 'ana@email.com', phone: '3004445566', nationality: 'España', companyId });
    console.log(' Created 4 guests');

    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 1);
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + 3);

    await em.save(Reservation, { 
        reservationNumber: 'RES-001', 
        roomId: r1.id,
        guestId: g1.id,
        checkIn, checkOut, adults: 2, children: 0,
        ratePerNight: 80000, totalAmount: 240000, paidAmount: 100000,
        status: ReservationStatus.CONFIRMED, source: ReservationSource.DIRECT, companyId
    });

    await em.save(Reservation, { 
        reservationNumber: 'RES-002', 
        roomId: r4.id,
        guestId: g2.id,
        checkIn, checkOut, adults: 2, children: 1,
        ratePerNight: 150000, totalAmount: 450000, paidAmount: 450000,
        status: ReservationStatus.CHECKED_IN, source: ReservationSource.OTA, companyId
    });
    console.log(' Created sample reservations');

    await dataSource.destroy();
    console.log(' Seed completed!');
}

seed().catch(console.error);