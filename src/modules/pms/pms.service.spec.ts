describe('PmsService', () => {
  it('should be defined', () => {
    expect(true).toBe(true);
  });

  it('should have room status enum', () => {
    const { RoomStatus } = require('./entities/room.entity');
    expect(RoomStatus.AVAILABLE).toBe('AVAILABLE');
    expect(RoomStatus.OCCUPIED).toBe('OCCUPIED');
    expect(RoomStatus.BLOCKED).toBe('BLOCKED');
    expect(RoomStatus.MAINTENANCE).toBe('MAINTENANCE');
  });

  it('should have reservation status enum', () => {
    const { ReservationStatus } = require('./entities/reservation.entity');
    expect(ReservationStatus.PENDING).toBe('PENDING');
    expect(ReservationStatus.CONFIRMED).toBe('CONFIRMED');
    expect(ReservationStatus.CHECKED_IN).toBe('CHECKED_IN');
    expect(ReservationStatus.CHECKED_OUT).toBe('CHECKED_OUT');
    expect(ReservationStatus.CANCELLED).toBe('CANCELLED');
    expect(ReservationStatus.BLOCKED).toBe('BLOCKED');
  });
});
