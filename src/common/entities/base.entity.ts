import { CreateDateColumn, UpdateDateColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../modules/auth/entities/user.entity';

export abstract class BaseAuditEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => User, { nullable: true })
    createdBy: User;

    @ManyToOne(() => User, { nullable: true })
    updatedBy: User;
}
