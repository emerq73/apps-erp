import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { authenticator } from '@otplib/preset-v11';
import * as QRCode from 'qrcode';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { LoginAudit } from './entities/login-audit.entity';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(Role)
        private roleRepository: Repository<Role>,
        @InjectRepository(Permission)
        private permissionRepository: Repository<Permission>,
        @InjectRepository(LoginAudit)
        private auditRepository: Repository<LoginAudit>,
        @InjectRepository(AuditLog)
        private dataAuditRepository: Repository<AuditLog>,
        private jwtService: JwtService,
    ) { }

    async hasPermission(userId: string, permissionName: string): Promise<boolean> {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['roleObject', 'roleObject.permissions']
        });

        if (!user || !user.roleObject) {
            // Si no tiene rol, verificar por rol legacy
            return user?.role === 'admin' || user?.role === 'manager';
        }

        return user.roleObject.permissions.some(p => p.name === permissionName);
    }

    async checkPermission(userId: string, permissionName: string): Promise<void> {
        const hasPerm = await this.hasPermission(userId, permissionName);
        if (!hasPerm) {
            throw new ForbiddenException(`No tienes permiso para: ${permissionName}`);
        }
    }

    async canEditPrices(userId: string): Promise<boolean> {
        return this.hasPermission(userId, 'edit_prices');
    }

    async canProcessDirectCharge(userId: string): Promise<boolean> {
        return this.hasPermission(userId, 'process_direct_charge');
    }

    async canApproveExpenses(userId: string): Promise<boolean> {
        return this.hasPermission(userId, 'approve_expenses');
    }

    async login(email: string, pass: string, ip?: string, ua?: string) {
        const recentFailures = await this.auditRepository.count({
            where: {
                email,
                success: false,
                attemptAt: MoreThan(new Date(Date.now() - 15 * 60 * 1000)),
            },
        });

        if (recentFailures >= 5) {
            throw new ForbiddenException('Cuenta bloqueada temporalmente. Intente en 15 minutos.');
        }

        const user = await this.userRepository.findOne({
            where: { email },
            select: ['id', 'email', 'password', 'fullName', 'isTwoFactorEnabled', 'twoFactorSecret'],
        });

        const isMatch = user && (await bcrypt.compare(pass, user.password));

        await this.auditRepository.save({
            email,
            success: !!isMatch,
            ipAddress: ip,
            userAgent: ua,
            user: isMatch ? user : null,
        });

        if (!isMatch) throw new UnauthorizedException('Credenciales inválidas');

        if (user.isTwoFactorEnabled) {
            return {
                requires2FA: true,
                tempToken: await this.jwtService.signAsync({ sub: user.id, isPartial: true }, { expiresIn: '5m' })
            };
        }

        return this.generateAuthResponse(user);
    }

    private async generateAuthResponse(user: User) {
        const payload = { sub: user.id, email: user.email };
        return {
            access_token: await this.jwtService.signAsync(payload),
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                isTwoFactorEnabled: user.isTwoFactorEnabled
            },
        };
    }

    async verify2FALogin(userId: string, code: string) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            select: ['id', 'email', 'fullName', 'twoFactorSecret', 'isTwoFactorEnabled']
        });

        if (!user || !user.isTwoFactorEnabled || !user.twoFactorSecret) {
            throw new UnauthorizedException('2FA no configurado');
        }

        const isValid = authenticator.verify({ token: code, secret: user.twoFactorSecret });
        if (!isValid) throw new UnauthorizedException('Código 2FA inválido');

        return this.generateAuthResponse(user);
    }

    async register(email: string, pass: string, fullName: string) {
        const hashedPassword = await bcrypt.hash(pass, 10);
        const user = this.userRepository.create({
            email,
            password: hashedPassword,
            fullName,
        });
        return this.userRepository.save(user);
    }

    async forgotPassword(email: string) {
        const user = await this.userRepository.findOne({ where: { email } });
        if (!user) {
            return { message: 'Si el correo existe, recibirá instrucciones.' };
        }

        const token = Math.random().toString(36).substring(2, 10).toUpperCase(); 
        user.resetToken = token;
        user.resetTokenExpires = new Date(Date.now() + 3600000); 
        await this.userRepository.save(user);

        console.log(`\n--- SIMULACIÓN DE CORREO ---`);
        console.log(`Para: ${email}`);
        console.log(`Código de recuperación: ${token}`);
        console.log(`------------------------------\n`);

        return { message: 'Si el correo existe, recibirá instrucciones.' };
    }

    async resetPassword(email: string, token: string, newPass: string) {
        const user = await this.userRepository.findOne({
            where: { email, resetToken: token, resetTokenExpires: MoreThan(new Date()) }
        });

        if (!user) {
            throw new UnauthorizedException('Código inválido o expirado');
        }

        user.password = await bcrypt.hash(newPass, 10);
        user.resetToken = null;
        user.resetTokenExpires = null;
        await this.userRepository.save(user);

        return { message: 'Contraseña actualizada con éxito' };
    }

    async generateTwoFactorSecret(userId: string) {
        const user = await this.userRepository.findOneBy({ id: userId });
        if (!user) throw new Error('Usuario no encontrado');

        const secret = authenticator.generateSecret();
        const otpauthUrl = authenticator.keyuri(user.email, 'Hotel ERP', secret);
        const qrCode = await QRCode.toDataURL(otpauthUrl);

        await this.userRepository.update(userId, { twoFactorSecret: secret });

        return { secret, qrCode };
    }

    async enableTwoFactor(userId: string, code: string) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            select: ['id', 'twoFactorSecret']
        });

        if (!user || !user.twoFactorSecret) throw new Error('Secret no generado');

        const isValid = authenticator.verify({ token: code, secret: user.twoFactorSecret });
        if (!isValid) throw new UnauthorizedException('Código inválido');

        await this.userRepository.update(userId, { isTwoFactorEnabled: true });
        return { success: true };
    }

    async getAuditLogs() {
        return this.dataAuditRepository.find({
            relations: ['user'],
            order: { createdAt: 'DESC' },
            take: 100 
        });
    }
}
