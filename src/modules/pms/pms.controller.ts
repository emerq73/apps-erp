import { Controller, Get, Post, Put, Delete, Patch, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { PmsService } from './pms.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoomStatus } from './entities/room.entity';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('PMS')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('pms')
export class PmsController {
    constructor(private readonly pmsService: PmsService) {}

    private getCompanyId(req: any): string {
        return req.headers['x-company-id'] || req.companyId;
    }

    // ─── ROOM TYPES ───────────────────────────────────────────
    @Get('room-types')
    @ApiOperation({ summary: 'Get all room types' })
    getRoomTypes(@Req() req: any) {
        return this.pmsService.getRoomTypes(this.getCompanyId(req));
    }

    @Post('room-types')
    @ApiOperation({ summary: 'Create room type' })
    createRoomType(@Req() req: any, @Body() body: any) {
        const companyId = this.getCompanyId(req);
        if (!companyId) {
            throw new Error('No hay empresa seleccionada. Selecciona una empresa primero.');
        }
        return this.pmsService.createRoomType(companyId, body);
    }

    @Put('room-types/:id')
    @ApiOperation({ summary: 'Update room type' })
    updateRoomType(@Param('id') id: string, @Body() body: any) {
        return this.pmsService.updateRoomType(id, body);
    }

    @Delete('room-types/:id')
    @ApiOperation({ summary: 'Delete room type' })
    deleteRoomType(@Param('id') id: string) {
        return this.pmsService.deleteRoomType(id);
    }

    // ─── ROOMS ───────────────────────────────────────────────
    @Get('rooms')
    @ApiOperation({ summary: 'Get all rooms' })
    getRooms(@Req() req: any) {
        return this.pmsService.getRooms(this.getCompanyId(req));
    }

    @Post('rooms')
    @ApiOperation({ summary: 'Create room' })
    createRoom(@Req() req: any, @Body() body: any) {
        return this.pmsService.createRoom(this.getCompanyId(req), body);
    }

    @Put('rooms/:id')
    @ApiOperation({ summary: 'Update room' })
    updateRoom(@Param('id') id: string, @Body() body: any) {
        return this.pmsService.updateRoom(id, body);
    }

    @Patch('rooms/:id/status')
    @ApiOperation({ summary: 'Update room status' })
    updateRoomStatus(@Param('id') id: string, @Body('status') status: RoomStatus) {
        return this.pmsService.updateRoomStatus(id, status);
    }

    @Delete('rooms/:id')
    @ApiOperation({ summary: 'Delete room' })
    deleteRoom(@Param('id') id: string) {
        return this.pmsService.deleteRoom(id);
    }

    @Post('rooms/:id/block')
    @ApiOperation({ summary: 'Block room for dates' })
    blockRoom(@Param('id') id: string, @Body() body: { reason: string; blockedFrom: string; blockedTo: string }) {
        return this.pmsService.blockRoom(id, body.reason, new Date(body.blockedFrom), new Date(body.blockedTo));
    }

    @Post('rooms/:id/unblock')
    @ApiOperation({ summary: 'Unblock room' })
    unblockRoom(@Param('id') id: string) {
        return this.pmsService.unblockRoom(id);
    }

    @Post('reservations/:id/transfer')
    @ApiOperation({ summary: 'Transfer reservation to another room' })
    transferRoom(@Param('id') id: string, @Body() body: { newRoomId: string }) {
        return this.pmsService.transferRoom(id, body.newRoomId);
    }

    // ─── ROOM RATES ─────────────────────────────────────────
    @Get('room-rates')
    getRoomRates(@Req() req: any, @Query('roomTypeId') roomTypeId?: string) {
        return this.pmsService.getRoomRates(this.getCompanyId(req), roomTypeId);
    }

    @Post('room-rates')
    createRoomRate(@Req() req: any, @Body() body: any) {
        return this.pmsService.createRoomRate(this.getCompanyId(req), body);
    }

    @Put('room-rates/:id')
    updateRoomRate(@Param('id') id: string, @Body() body: any) {
        return this.pmsService.updateRoomRate(id, body);
    }

    @Delete('room-rates/:id')
    deleteRoomRate(@Param('id') id: string) {
        return this.pmsService.deleteRoomRate(id);
    }

    @Get('calculate-rate')
    calculateRate(@Query('roomTypeId') roomTypeId: string, @Query('checkIn') checkIn: string, @Query('checkOut') checkOut: string, @Query('adults') adults: number, @Query('children') children: number) {
        return this.pmsService.calculateRate(roomTypeId, new Date(checkIn), new Date(checkOut), Number(adults) || 1, Number(children) || 0);
    }

    // ─── CANCELLATION POLICIES ─────────────────────────────────
    @Get('cancellation-policies')
    getCancellationPolicies(@Req() req: any) {
        return this.pmsService.getCancellationPolicies(this.getCompanyId(req));
    }

    @Post('cancellation-policies')
    createCancellationPolicy(@Req() req: any, @Body() body: any) {
        return this.pmsService.createCancellationPolicy(this.getCompanyId(req), body);
    }

    @Put('cancellation-policies/:id')
    updateCancellationPolicy(@Param('id') id: string, @Body() body: any) {
        return this.pmsService.updateCancellationPolicy(id, body);
    }

    @Delete('cancellation-policies/:id')
    deleteCancellationPolicy(@Param('id') id: string) {
        return this.pmsService.deleteCancellationPolicy(id);
    }

    @Get('calculate-cancellation-penalty/:id')
    calculateCancellationPenalty(@Param('id') id: string) {
        return this.pmsService.calculateCancellationPenalty(id);
    }

    // ─── REPORTS ──────────────────────────────────────────────
    @Get('reports/occupancy')
    @ApiOperation({ summary: 'Get occupancy report' })
    @ApiQuery({ name: 'start', required: false })
    @ApiQuery({ name: 'end', required: false })
    getOccupancyReport(@Req() req: any, @Query('start') start: string, @Query('end') end: string) {
        const companyId = this.getCompanyId(req);
        return this.pmsService.getOccupancyReport(companyId, start, end);
    }

    @Get('reports/revenue')
    @ApiOperation({ summary: 'Get revenue report' })
    @ApiQuery({ name: 'start', required: false })
    @ApiQuery({ name: 'end', required: false })
    getRevenueReport(@Req() req: any, @Query('start') start: string, @Query('end') end: string) {
        const companyId = this.getCompanyId(req);
        return this.pmsService.getRevenueReport(companyId, start, end);
    }

    @Get('reports/daily')
    @ApiOperation({ summary: 'Get daily occupancy report' })
    @ApiQuery({ name: 'date', required: false })
    getDailyReport(@Req() req: any, @Query('date') date: string) {
        const companyId = this.getCompanyId(req);
        return this.pmsService.getDailyReport(companyId, date);
    }

    @Get('reports/guest-history')
    @ApiOperation({ summary: 'Get guest stay history' })
    @ApiQuery({ name: 'guestId', required: false })
    getGuestHistory(@Req() req: any, @Query('guestId') guestId: string) {
        const companyId = this.getCompanyId(req);
        return this.pmsService.getGuestHistory(companyId, guestId);
    }

    // ─── INVOICES ───────────────────────────────────────────
    @Get('invoices')
    getInvoices(@Req() req: any, @Query('status') status?: string) {
        return this.pmsService.getInvoices(this.getCompanyId(req), status);
    }

    @Get('invoices/:id')
    getInvoiceById(@Param('id') id: string) {
        return this.pmsService.getInvoiceById(id);
    }

    @Post('invoices')
    createInvoice(@Req() req: any, @Body() body: any) {
        return this.pmsService.createInvoice(this.getCompanyId(req), body);
    }

    @Post('invoices/from-reservation/:reservationId')
    generateInvoiceFromReservation(@Param('reservationId') reservationId: string) {
        return this.pmsService.generateInvoiceFromReservation(reservationId);
    }

    @Patch('invoices/:id/payment')
    recordPayment(@Param('id') id: string, @Body() body: { amount: number; method: string }) {
        return this.pmsService.recordPayment(id, body.amount, body.method);
    }

    @Patch('invoices/:id/cancel')
    cancelInvoice(@Param('id') id: string) {
        return this.pmsService.cancelInvoice(id);
    }

    // ─── DASHBOARD ───────────────────────────────────────────
    @Get('dashboard')
    getOccupancyDashboard(@Req() req: any) {
        return this.pmsService.getOccupancyDashboard(this.getCompanyId(req));
    }

    // ─── GUESTS ──────────────────────────────────────────────
    @Get('guests')
    getGuests(@Req() req: any, @Query('search') search: string) {
        return this.pmsService.getGuests(this.getCompanyId(req), search);
    }

    @Post('guests')
    createGuest(@Req() req: any, @Body() body: any) {
        return this.pmsService.createGuest(this.getCompanyId(req), body);
    }

    @Put('guests/:id')
    updateGuest(@Param('id') id: string, @Body() body: any) {
        return this.pmsService.updateGuest(id, body);
    }

    @Delete('guests/:id')
    deleteGuest(@Param('id') id: string) {
        return this.pmsService.deleteGuest(id);
    }

    // ─── RESERVATIONS ────────────────────────────────────────
    @Get('reservations')
    getReservations(@Req() req: any, @Query('status') status: string) {
        return this.pmsService.getReservations(this.getCompanyId(req), status);
    }

    @Get('reservations/calendar')
    getReservationsForCalendar(@Req() req: any, @Query('start') start: string, @Query('end') end: string) {
        const companyId = this.getCompanyId(req);
        if (!companyId) {
            throw new Error('No hay empresa seleccionada');
        }
        return this.pmsService.getReservationsForCalendar(companyId, start, end);
    }

    @Get('tape-chart')
    @ApiOperation({ summary: 'Get data for interactive tape chart' })
    getTapeChart(@Req() req: any, @Query('start') start: string, @Query('end') end: string) {
        return this.pmsService.getTapeChart(this.getCompanyId(req), start, end);
    }

    @Get('reservations/:id')
    getReservation(@Param('id') id: string) {
        return this.pmsService.getReservation(id);
    }

    @Post('reservations')
    createReservation(@Req() req: any, @Body() body: any) {
        return this.pmsService.createReservation(this.getCompanyId(req), body);
    }

    @Put('reservations/:id')
    updateReservation(@Param('id') id: string, @Body() body: any) {
        return this.pmsService.updateReservation(id, body);
    }

    @Patch('reservations/:id/check-in')
    @ApiOperation({ summary: 'Check-in with signature and key card' })
    checkIn(@Param('id') id: string, @Body() body: { guestSignature?: string; idDocumentType?: string; idDocumentNumber?: string; keyCardNumber?: string }) {
        return this.pmsService.checkIn(id, body);
    }

    @Patch('reservations/:id/check-out')
    @ApiOperation({ summary: 'Check-out with notes' })
    async checkOut(@Param('id') id: string, @Body() body: { forceLateCheckout?: boolean; applyLateFee?: boolean; keyCardReturned?: boolean; notes?: string }) {
        try {
            return await this.pmsService.checkOut(id, body);
        } catch (error) {
            console.error('Check-out error:', error);
            throw error;
        }
    }

    @Patch('reservations/:id/confirm')
    confirmReservation(@Param('id') id: string) {
        return this.pmsService.confirmReservation(id);
    }

    @Patch('reservations/:id/cancel')
    cancelReservation(@Param('id') id: string) {
        return this.pmsService.cancelReservation(id);
    }

    @Patch('reservations/:id/move')
    moveReservation(@Param('id') id: string, @Body() body: { roomId?: string; checkIn?: string; checkOut?: string }) {
        return this.pmsService.moveReservation(id, body);
    }

    @Patch('reservations/:id/assign-room')
    @ApiOperation({ summary: 'Assign room to unassigned reservation' })
    assignRoom(@Param('id') id: string, @Body() body: { roomId: string }) {
        return this.pmsService.assignRoom(id, body.roomId);
    }

    @Patch('reservations/:id/alerts')
    @ApiOperation({ summary: 'Set reservation alerts (red/yellow)' })
    setAlert(@Param('id') id: string, @Body() body: { hasRedAlert?: boolean; hasYellowAlert?: boolean; alertMessage?: string }) {
        return this.pmsService.setAlert(id, body);
    }

    @Patch('reservations/:id/extend')
    @ApiOperation({ summary: 'Extend reservation stay' })
    extendStay(@Param('id') id: string, @Body() body: { additionalDays: number }) {
        return this.pmsService.extendStay(id, body.additionalDays);
    }

    @Post('reservations/:id/add-charge')
    @ApiOperation({ summary: 'Add charge to reservation' })
    addCharge(@Param('id') id: string, @Body() body: { description: string; amount: number }) {
        return this.pmsService.addCharge(id, body.description, body.amount);
    }

    @Get('reservations/search')
    @ApiOperation({ summary: 'Global search - by name, confirmation, ID' })
    globalSearch(@Req() req: any, @Query('q') q: string) {
        return this.pmsService.globalSearch(this.getCompanyId(req), q);
    }

    @Post('reservations/walk-in')
    @ApiOperation({ summary: 'Create walk-in reservation' })
    createWalkIn(@Req() req: any, @Body() body: any) {
        return this.pmsService.createWalkIn(this.getCompanyId(req), body);
    }

    @Get('availability')
    checkAvailability(@Req() req: any, @Query('checkIn') checkIn: string, @Query('checkOut') checkOut: string, @Query('roomTypeId') roomTypeId?: string) {
        const companyId = this.getCompanyId(req);
        if (!companyId) {
            throw new Error('No hay empresa seleccionada');
        }
        if (!checkIn || !checkOut) {
            throw new Error('Las fechas de check-in y check-out son requeridas');
        }
        return this.pmsService.checkAvailability(companyId, checkIn, checkOut, roomTypeId);
    }

    // ─── HOUSEKEEPING ────────────────────────────────────────
    @Get('cleaning-requests')
    getCleaningRequests(@Req() req: any, @Query('status') status?: string, @Query('date') date?: string) {
        return this.pmsService.getCleaningRequests(this.getCompanyId(req), status, date);
    }

    @Get('cleaning-stats')
    getCleaningStats(@Req() req: any) {
        return this.pmsService.getCleaningStats(this.getCompanyId(req));
    }

    @Post('cleaning-requests')
    createCleaningRequest(@Req() req: any, @Body() body: any) {
        return this.pmsService.createCleaningRequest(this.getCompanyId(req), body);
    }

    @Put('cleaning-requests/:id')
    updateCleaningRequest(@Param('id') id: string, @Body() body: any) {
        return this.pmsService.updateCleaningRequest(id, body);
    }

    @Delete('cleaning-requests/:id')
    deleteCleaningRequest(@Param('id') id: string) {
        return this.pmsService.deleteCleaningRequest(id);
    }

    @Patch('cleaning-requests/:id/start')
    startCleaning(@Param('id') id: string, @Body() body: { assignedTo: string }) {
        return this.pmsService.startCleaning(id, body.assignedTo);
    }

    @Patch('cleaning-requests/:id/complete')
    completeCleaning(@Param('id') id: string) {
        return this.pmsService.completeCleaning(id);
    }

    @Post('cleaning-requests/sync')
    syncCleaningRequests(@Req() req: any) {
        return this.pmsService.syncCleaningRequests(this.getCompanyId(req));
    }

    @Get('cleaning-staff')
    getCleaningStaff(@Req() req: any) {
        return this.pmsService.getCleaningStaffByRole(this.getCompanyId(req));
    }

    @Post('cleaning-staff')
    createCleaningStaff(@Req() req: any, @Body() body: any) {
        return this.pmsService.createCleaningStaff(this.getCompanyId(req), body);
    }

    @Put('cleaning-staff/:id')
    updateCleaningStaff(@Param('id') id: string, @Body() body: any) {
        return this.pmsService.updateCleaningStaff(id, body);
    }

    @Delete('cleaning-staff/:id')
    deleteCleaningStaff(@Param('id') id: string) {
        return this.pmsService.deleteCleaningStaff(id);
    }

    // ─── MAINTENANCE ─────────────────────────────────────────
    @Get('maintenance-requests')
    getMaintenanceRequests(@Req() req: any, @Query('status') status?: string) {
        return this.pmsService.getMaintenanceRequests(this.getCompanyId(req), status);
    }

    @Get('maintenance-stats')
    getMaintenanceStats(@Req() req: any) {
        return this.pmsService.getMaintenanceStats(this.getCompanyId(req));
    }

    @Post('maintenance-requests')
    createMaintenanceRequest(@Req() req: any, @Body() body: any) {
        return this.pmsService.createMaintenanceRequest(this.getCompanyId(req), body);
    }

    @Put('maintenance-requests/:id')
    updateMaintenanceRequest(@Param('id') id: string, @Body() body: any) {
        return this.pmsService.updateMaintenanceRequest(id, body);
    }

    @Delete('maintenance-requests/:id')
    deleteMaintenanceRequest(@Param('id') id: string) {
        return this.pmsService.deleteMaintenanceRequest(id);
    }

    @Patch('maintenance-requests/:id/assign')
    assignMaintenanceRequest(@Param('id') id: string, @Body() body: { staffId: string; isSupervisor?: boolean }) {
        return this.pmsService.assignMaintenanceRequest(id, body.staffId, body.isSupervisor);
    }

    @Patch('maintenance-requests/:id/complete')
    completeMaintenance(@Param('id') id: string) {
        return this.pmsService.completeMaintenance(id);
    }

    @Post('maintenance-requests/sync')
    syncMaintenanceRequests(@Req() req: any) {
        return this.pmsService.syncMaintenanceRequests(this.getCompanyId(req));
    }

    // ─── MAINTENANCE STAFF ─────────────────────────────────
    @Get('maintenance-staff')
    getMaintenanceStaff(@Req() req: any) {
        return this.pmsService.getMaintenanceStaff(this.getCompanyId(req));
    }

    @Post('maintenance-staff')
    createMaintenanceStaff(@Req() req: any, @Body() body: any) {
        return this.pmsService.createMaintenanceStaff(this.getCompanyId(req), body);
    }

    @Put('maintenance-staff/:id')
    updateMaintenanceStaff(@Param('id') id: string, @Body() body: any) {
        return this.pmsService.updateMaintenanceStaff(id, body);
    }

    @Delete('maintenance-staff/:id')
    deleteMaintenanceStaff(@Param('id') id: string) {
        return this.pmsService.deleteMaintenanceStaff(id);
    }

    // ─── RESTAURANT ─────────────────────────────────────
    @Get('restaurant-tables')
    getRestaurantTables(@Req() req: any) {
        return this.pmsService.getRestaurantTables(this.getCompanyId(req));
    }

    @Post('restaurant-tables')
    createRestaurantTable(@Req() req: any, @Body() body: any) {
        return this.pmsService.createRestaurantTable(this.getCompanyId(req), body);
    }

    @Put('restaurant-tables/:id')
    updateRestaurantTable(@Param('id') id: string, @Body() body: any) {
        return this.pmsService.updateRestaurantTable(id, body);
    }

    @Delete('restaurant-tables/:id')
    deleteRestaurantTable(@Param('id') id: string) {
        return this.pmsService.deleteRestaurantTable(id);
    }

    @Get('menu-categories')
    getMenuCategories(@Req() req: any) {
        return this.pmsService.getMenuCategories(this.getCompanyId(req));
    }

    @Post('menu-categories')
    createMenuCategory(@Req() req: any, @Body() body: any) {
        return this.pmsService.createMenuCategory(this.getCompanyId(req), body);
    }

    @Put('menu-categories/:id')
    updateMenuCategory(@Param('id') id: string, @Body() body: any) {
        return this.pmsService.updateMenuCategory(id, body);
    }

    @Get('menu-items')
    getMenuItems(@Req() req: any, @Query('categoryId') categoryId?: string) {
        return this.pmsService.getMenuItems(this.getCompanyId(req), categoryId);
    }

    @Post('menu-items')
    createMenuItem(@Req() req: any, @Body() body: any) {
        return this.pmsService.createMenuItem(this.getCompanyId(req), body);
    }

    @Put('menu-items/:id')
    updateMenuItem(@Param('id') id: string, @Body() body: any) {
        return this.pmsService.updateMenuItem(id, body);
    }

    @Get('restaurant-orders')
    getRestaurantOrders(@Req() req: any, @Query('status') status?: string) {
        return this.pmsService.getRestaurantOrders(this.getCompanyId(req), status);
    }

    @Get('restaurant-orders/:id')
    getRestaurantOrderById(@Param('id') id: string) {
        return this.pmsService.getRestaurantOrderById(id);
    }

    @Get('restaurant-orders/:id/print')
    getRestaurantOrderPrint(@Param('id') id: string) {
        return this.pmsService.getRestaurantOrderPrint(id);
    }

    @Post('restaurant-orders')
    createRestaurantOrder(@Req() req: any, @Body() body: any) {
        return this.pmsService.createRestaurantOrder(this.getCompanyId(req), body);
    }

    @Patch('restaurant-orders/:id')
    updateRestaurantOrder(@Param('id') id: string, @Body() body: any) {
        return this.pmsService.updateRestaurantOrder(id, body);
    }

    @Get('restaurant-stats')
    getRestaurantStats(@Req() req: any) {
        return this.pmsService.getRestaurantStats(this.getCompanyId(req));
    }

    @Patch('cleaning-requests/:id/assign')
    assignCleaningRequest(@Param('id') id: string, @Body() body: { staffId: string; isSupervisor?: boolean }) {
        return this.pmsService.assignCleaningRequest(id, body.staffId, body.isSupervisor);
    }

    @Patch('cleaning-requests/:id/verify')
    verifyCleaning(@Param('id') id: string, @Body() body: { staffId: string }) {
        return this.pmsService.verifyCleaning(id, body.staffId);
    }

    // ─── CASH DRAWER ─────────────────────────────────────
    @Get('cash-drawer')
    getCashDrawer(@Req() req: any) {
        return this.pmsService.getOpenDrawer(this.getCompanyId(req));
    }

    @Post('cash-drawer/open')
    openCashDrawer(@Req() req: any, @Body() body: { openingAmount: number }) {
        return this.pmsService.openCashDrawer(this.getCompanyId(req), body.openingAmount, req.user.userId);
    }

    @Post('cash-drawer/close')
    closeCashDrawer(@Req() req: any, @Body() body: { actualAmount: number; notes?: string }) {
        const companyId = this.getCompanyId(req);
        if (!companyId) throw new Error('No hay empresa seleccionada');
        const userId = req.user?.userId || '';
        return this.pmsService.closeCashDrawer(companyId, body.actualAmount, body.notes || '', userId);
    }

    @Post('cash-drawer/transactions')
    addDrawerTransaction(@Req() req: any, @Body() body: { type: string; amount: number; paymentMethod: string; description?: string; reservationId?: string; invoiceId?: string }) {
        const companyId = this.getCompanyId(req);
        if (!companyId) throw new Error('No hay empresa seleccionada');
        return this.pmsService.addDrawerTransaction(companyId, body, req.user.userId);
    }

    @Get('cash-drawer/transactions')
    getDrawerTransactions(@Req() req: any, @Query('drawerId') drawerId?: string) {
        return this.pmsService.getDrawerTransactions(drawerId || '');
    }

    @Post('cash-drawer/audit')
    @ApiOperation({ summary: 'Perform hourly or shift audit' })
    performAudit(@Req() req: any, @Body() body: { auditType: string; actualAmount: number; notes?: string }) {
        const companyId = this.getCompanyId(req);
        if (!companyId) throw new Error('No hay empresa seleccionada');
        const userId = req.user?.userId || '';
        return this.pmsService.performAudit(companyId, body.auditType, body.actualAmount, body.notes || '', userId);
    }

    // ─── PAYMENT SPLITS ─────────────────────────────────
    @Post('invoices/:id/split-payment')
    @ApiOperation({ summary: 'Record split payment' })
    recordSplitPayment(@Param('id') id: string, @Body() body: { splits: { amount: number; paymentMethod: string; reference?: string; isPreAuth?: boolean; cardLast4?: string }[] }) {
        return this.pmsService.recordSplitPayment(id, body.splits);
    }

    @Post('invoices/:id/pre-authorize')
    @ApiOperation({ summary: 'Pre-authorize card' })
    preAuthorizeCard(@Param('id') id: string, @Body() body: { amount: number; reference: string; cardLast4: string }) {
        return this.pmsService.preAuthorizeCard(id, body);
    }

    @Post('payments/:id/capture')
    @ApiOperation({ summary: 'Capture pre-authorized payment' })
    capturePayment(@Param('id') id: string) {
        return this.pmsService.capturePayment(id);
    }

    @Post('payments/:id/reverse')
    @ApiOperation({ summary: 'Reverse payment' })
    reversePayment(@Param('id') id: string, @Body() body: { reason: string }) {
        return this.pmsService.reversePayment(id, body.reason);
    }

    // ─── DEPOSIT TRANSFERS ───────────────────────────────
    @Post('deposits/transfer')
    @ApiOperation({ summary: 'Transfer deposit between reservations' })
    transferDeposit(@Req() req: any, @Body() body: { fromReservationId: string; toReservationId: string; amount: number; reason?: string }) {
        return this.pmsService.transferDeposit(this.getCompanyId(req), body, req.user.userId);
    }

    // ─── SHARED INVENTORY ─────────────────────────────
    @Post('inventory/link')
    @ApiOperation({ summary: 'Link room types for shared inventory' })
    linkInventory(@Body() body: { primaryRoomTypeId: string; secondaryRoomTypeId: string; autoBlock?: boolean }) {
        return this.pmsService.linkInventory(body);
    }

    @Get('inventory/availability')
    @ApiOperation({ summary: 'Check shared inventory availability' })
    checkSharedAvailability(@Req() req: any, @Query('checkIn') checkIn: string, @Query('checkOut') checkOut: string) {
        return this.pmsService.checkSharedAvailability(this.getCompanyId(req), checkIn, checkOut);
    }

    // ─── UNASSIGNED RESERVATIONS ────────────────────────
    @Get('reservations/unassigned')
    getUnassignedReservations(@Req() req: any) {
        return this.pmsService.getUnassignedReservations(this.getCompanyId(req));
    }

    @Patch('reservations/:id/assign-unassigned')
    @ApiOperation({ summary: 'Assign reservation from unassigned pool' })
    assignFromUnassigned(@Param('id') id: string, @Body() body: { roomId: string }) {
        return this.pmsService.assignRoom(id, body.roomId);
    }
}
