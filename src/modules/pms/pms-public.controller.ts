import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PmsService } from './pms.service';
import { ReservationStatus } from './entities/reservation.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Raw } from 'typeorm';
import { Room, RoomStatus } from './entities/room.entity';
import { RoomType } from './entities/room-type.entity';
import { Reservation } from './entities/reservation.entity';
import { Guest } from './entities/guest.entity';

@ApiTags('PMS Public')
@Controller('pms/public')
export class PmsPublicController {
  constructor(
    private readonly pmsService: PmsService,
    @InjectRepository(Room) private roomRepo: Repository<Room>,
    @InjectRepository(RoomType) private roomTypeRepo: Repository<RoomType>,
    @InjectRepository(Reservation)
    private reservationRepo: Repository<Reservation>,
    @InjectRepository(Guest) private guestRepo: Repository<Guest>,
  ) {}

  /**
   * GET /pms/public/availability
   * Returns available room types with pricing. No auth required.
   */
  @Get('availability')
  @ApiOperation({ summary: 'Public: Check room availability' })
  async getPublicAvailability(
    @Query('companyId') companyId: string,
    @Query('checkIn') checkIn: string,
    @Query('checkOut') checkOut: string,
    @Query('guests') guests?: string,
  ) {
    if (!companyId || !checkIn || !checkOut) {
      throw new HttpException(
        'companyId, checkIn y checkOut son requeridos',
        HttpStatus.BAD_REQUEST,
      );
    }

    const ciDate = new Date(checkIn);
    const coDate = new Date(checkOut);

    if (isNaN(ciDate.getTime()) || isNaN(coDate.getTime())) {
      throw new HttpException('Fechas inválidas', HttpStatus.BAD_REQUEST);
    }
    if (coDate <= ciDate) {
      throw new HttpException(
        'La fecha de check-out debe ser posterior al check-in',
        HttpStatus.BAD_REQUEST,
      );
    }

    const nights = Math.ceil((coDate.getTime() - ciDate.getTime()) / 86400000);
    const guestCount = Math.max(1, Number(guests) || 2);

    // All room types for this company
    const roomTypes = await this.roomTypeRepo.find({
      where: { company: { id: companyId } },
      relations: ['rooms'],
      order: { basePrice: 'ASC' },
    });

    // Conflicting reservations in range
    const conflicts = await this.reservationRepo
      .createQueryBuilder('r')
      .where('r.companyId = :companyId', { companyId })
      .andWhere('r.status NOT IN (:...excluded)', {
        excluded: [ReservationStatus.CANCELLED, ReservationStatus.NO_SHOW],
      })
      .andWhere('r.checkIn < :coDate', { coDate })
      .andWhere('r.checkOut > :ciDate', { ciDate })
      .select(['r.roomId'])
      .getMany();

    const occupiedIds = new Set(conflicts.map((r) => r.roomId).filter(Boolean));

    const results = await Promise.all(
      roomTypes.map(async (rt) => {
        const availableRooms = (rt.rooms || []).filter(
          (r) => r.status !== RoomStatus.MAINTENANCE && !occupiedIds.has(r.id),
        );
        if (availableRooms.length === 0) return null;

        let rateInfo: any;
        try {
          rateInfo = await this.pmsService.calculateRate(
            rt.id,
            ciDate,
            coDate,
            Math.min(guestCount, rt.capacity || 2),
            0,
          );
        } catch {
          rateInfo = {
            nightlyRate: Number(rt.basePrice),
            totalRate: Number(rt.basePrice) * nights,
            appliedRate: 'STANDARD',
          };
        }

        return {
          roomTypeId: rt.id,
          name: rt.name,
          description: rt.description || '',
          capacity: rt.capacity || 2,
          images: (rt as any).images || [],
          amenities: (rt as any).amenities || [],
          availableCount: availableRooms.length,
          nightlyRate: Number(rateInfo.nightlyRate),
          totalRate: Number(rateInfo.totalRate),
          nights,
          currency: 'DOP',
          appliedRate: rateInfo.appliedRate,
          suggestedRoomId: availableRooms[0].id,
          suggestedRoomNumber: availableRooms[0].number,
        };
      }),
    );

    return {
      companyId,
      checkIn,
      checkOut,
      nights,
      guests: guestCount,
      roomTypes: results.filter(Boolean),
    };
  }

  /**
   * GET /pms/public/hotel-info/:companyId
   * Basic hotel info for widget header. No auth required.
   */
  @Get('hotel-info/:companyId')
  @ApiOperation({ summary: 'Public: Get hotel info' })
  async getHotelInfo(@Param('companyId') companyId: string) {
    const roomTypes = await this.roomTypeRepo.find({
      where: { company: { id: companyId } },
      relations: ['rooms'],
    });

    const totalRooms = roomTypes.reduce(
      (s, rt) => s + (rt.rooms?.length || 0),
      0,
    );
    const prices = roomTypes
      .map((rt) => Number(rt.basePrice))
      .filter((p) => p > 0);
    const minPrice = prices.length ? Math.min(...prices) : 0;

    return {
      companyId,
      totalRoomTypes: roomTypes.length,
      totalRooms,
      minPrice,
      currency: 'DOP',
    };
  }

  /**
   * POST /pms/public/bookings
   * Creates a direct booking from the booking engine. No auth required.
   */
  @Post('bookings')
  @ApiOperation({ summary: 'Public: Create direct booking' })
  async createPublicBooking(
    @Body()
    body: {
      companyId: string;
      roomTypeId: string;
      roomId: string;
      checkIn: string;
      checkOut: string;
      adults: number;
      children?: number;
      ratePerNight: number;
      specialRequests?: string;
      guest: {
        firstName: string;
        lastName: string;
        email: string;
        phone?: string;
        docNumber?: string;
        nationality?: string;
      };
    },
  ) {
    const {
      companyId,
      roomId,
      checkIn,
      checkOut,
      adults,
      children = 0,
      ratePerNight,
      specialRequests,
      guest,
    } = body;

    // Validate required fields
    if (!companyId)
      throw new HttpException('companyId es requerido', HttpStatus.BAD_REQUEST);
    if (!roomId)
      throw new HttpException('roomId es requerido', HttpStatus.BAD_REQUEST);
    if (!checkIn)
      throw new HttpException('checkIn es requerido', HttpStatus.BAD_REQUEST);
    if (!checkOut)
      throw new HttpException('checkOut es requerido', HttpStatus.BAD_REQUEST);
    if (!guest?.firstName)
      throw new HttpException(
        'Nombre del huésped es requerido',
        HttpStatus.BAD_REQUEST,
      );
    if (!guest?.lastName)
      throw new HttpException(
        'Apellido del huésped es requerido',
        HttpStatus.BAD_REQUEST,
      );
    if (!guest?.email)
      throw new HttpException(
        'Correo del huésped es requerido',
        HttpStatus.BAD_REQUEST,
      );

    try {
      // 1. Find or create guest by email + company relation
      let guestRecord = await this.guestRepo
        .createQueryBuilder('g')
        .where('g.email = :email', { email: guest.email })
        .innerJoin('g.company', 'c', 'c.id = :companyId', { companyId })
        .getOne();

      if (!guestRecord) {
        guestRecord = this.guestRepo.create({
          firstName: guest.firstName,
          lastName: guest.lastName,
          email: guest.email,
          phone: guest.phone || '',
          docNumber: guest.docNumber || '',
          nationality: guest.nationality || '',
          source: 'BOOKING_ENGINE',
          company: { id: companyId },
        });
        guestRecord = await this.guestRepo.save(guestRecord);
      }

      // 2. Create the reservation via the service (handles conflict detection & numbering)
      const reservation = await this.pmsService.createReservation(companyId, {
        roomId,
        guestId: guestRecord.id,
        checkIn,
        checkOut,
        adults: Number(adults) || 1,
        children: Number(children) || 0,
        ratePerNight: Number(ratePerNight) || 0,
        specialRequests: specialRequests || '',
        autoConfirm: true,
        source: 'BOOKING_ENGINE',
      });

      return {
        success: true,
        confirmationNumber: (reservation as any).reservationNumber,
        guestName: `${guest.firstName} ${guest.lastName}`,
        roomId,
        checkIn,
        checkOut,
        totalAmount: (reservation as any).totalAmount,
        currency: 'DOP',
        message: '¡Reserva confirmada! Recibirás un correo de confirmación.',
      };
    } catch (err) {
      // Surface validation errors clearly to the frontend
      const msg = err?.message || 'Error al procesar la reserva';
      throw new HttpException(msg, HttpStatus.BAD_REQUEST);
    }
  }
}
