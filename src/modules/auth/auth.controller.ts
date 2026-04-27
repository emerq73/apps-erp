import { Controller, Post, Get, Body, HttpCode, HttpStatus, UseGuards, Request, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('register')
    @ApiOperation({ summary: 'Register new user' })
    register(@Body() body: any) {
        return this.authService.register(body.email, body.password, body.fullName);
    }

    @HttpCode(HttpStatus.OK)
    @Post('login')
    @ApiOperation({ summary: 'Login user' })
    login(@Body() body: any) {
        return this.authService.login(body.email, body.password);
    }

    @HttpCode(HttpStatus.OK)
    @Post('forgot-password')
    @ApiOperation({ summary: 'Request password reset' })
    forgotPassword(@Body() body: { email: string }) {
        return this.authService.forgotPassword(body.email);
    }

    @HttpCode(HttpStatus.OK)
    @Post('reset-password')
    @ApiOperation({ summary: 'Reset password with token' })
    resetPassword(@Body() body: { email: string; token: string; newPass: string }) {
        return this.authService.resetPassword(body.email, body.token, body.newPass);
    }

    @Get('audit-logs')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get audit logs' })
    getAuditLogs() {
        return this.authService.getAuditLogs();
    }

    @Post('verify-2fa')
    @ApiOperation({ summary: 'Verify 2FA code' })
    async verify2FALogin(@Body() body: { userId: string; code: string }) {
        return this.authService.verify2FALogin(body.userId, body.code);
    }

    @Post('generate-2fa')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Generate 2FA secret' })
    async generate2FA(@Request() req: any) {
        return this.authService.generateTwoFactorSecret(req.user.userId);
    }

    @Post('enable-2fa')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Enable 2FA' })
    async enable2FA(@Request() req: any, @Body() body: { code: string }) {
        return this.authService.enableTwoFactor(req.user.userId, body.code);
    }

    @Get('check-permission/:permission')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Check if user has permission' })
    async checkPermission(@Request() req: any, @Param('permission') permission: string) {
        const hasPermission = await this.authService.hasPermission(req.user.userId, permission);
        return { hasPermission };
    }

    @Get('can-edit-prices')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    async canEditPrices(@Request() req: any) {
        return { canEdit: await this.authService.canEditPrices(req.user.userId) };
    }

    @Get('can-process-direct-charge')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    async canProcessDirectCharge(@Request() req: any) {
        return { canProcess: await this.authService.canProcessDirectCharge(req.user.userId) };
    }

    @Get('can-approve-expenses')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    async canApproveExpenses(@Request() req: any) {
        return { canApprove: await this.authService.canApproveExpenses(req.user.userId) };
    }
}
