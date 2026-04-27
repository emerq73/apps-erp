import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';

@Entity('audit_logs')
export class AuditLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    tableName: string;

    @Column()
    recordId: string;

    @Column({ type: 'enum', enum: ['INSERT', 'UPDATE', 'DELETE'] })
    action: string;

    @Column({ type: 'jsonb', nullable: true })
    oldValue: any;

    @Column({ type: 'jsonb', nullable: true })
    newValue: any;

    @ManyToOne(() => User, { nullable: true })
    user: User;

    @Column({ nullable: true })
    ipAddress: string;

    @CreateDateColumn()
    createdAt: Date;
}
