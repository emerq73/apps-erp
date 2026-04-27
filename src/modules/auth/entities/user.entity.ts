import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Role } from './role.entity';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    email: string;

    @Column({ select: false })
    password: string;

    @Column()
    fullName: string;

    @Column({ default: true })
    isActive: boolean;

    @ManyToOne(() => Role, (role) => role.users)
    roleObject: Role;

    @Column({ default: 'admin' }) // Mantener por compatibilidad
    role: string;

    @Column({ type: 'varchar', nullable: true })
    resetToken: string | null;

    @Column({ type: 'timestamp', nullable: true })
    resetTokenExpires: Date | null;

    @Column({ type: 'varchar', nullable: true, select: false })
    twoFactorSecret: string | null;

    @Column({ default: false })
    isTwoFactorEnabled: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
