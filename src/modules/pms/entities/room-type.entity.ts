import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseAuditEntity } from '../../../common/entities/base.entity';
import { Company } from '../../accounting/entities/company.entity';
import { Room } from './room.entity';

@Entity('room_types')
export class RoomType extends BaseAuditEntity {
    @Column()
    name: string;

    @Column({ nullable: true })
    description: string;

    @Column({ type: 'decimal', precision: 18, scale: 2 })
    basePrice: number;

    @Column({ type: 'int', default: 2 })
    capacity: number;

    @ManyToOne(() => Company)
    company: Company;

    @OneToMany(() => Room, room => room.roomType)
    rooms: Room[];
}
