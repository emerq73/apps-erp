import { Entity, Column, PrimaryGeneratedColumn, ManyToMany, JoinTable, OneToMany } from 'typeorm';
import { Permission } from './permission.entity';
import { User } from './user.entity';

@Entity('roles')
export class Role {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    name: string; // Ej: 'Admin', 'Receptionist', 'Accountant'

    @ManyToMany(() => Permission, (permission) => permission.roles)
    @JoinTable({ name: 'roles_permissions' })
    permissions: Permission[];

    @OneToMany(() => User, (user) => user.roleObject)
    users: User[];
}
