import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { BaseAuditEntity } from '../../../common/entities/base.entity';
import { Company } from '../../accounting/entities/company.entity';
import { RoomType } from './room-type.entity';

export enum RoomStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  MAINTENANCE = 'MAINTENANCE',
  CLEANING = 'CLEANING',
  BLOCKED = 'BLOCKED',
  OUT_OF_ORDER = 'OUT_OF_ORDER',
}

@Entity('rooms')
export class Room extends BaseAuditEntity {
  @Column()
  number: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  floor: string;

  @Column({ type: 'enum', enum: RoomStatus, default: RoomStatus.AVAILABLE })
  status: RoomStatus;

  @ManyToOne(() => RoomType, (roomType) => roomType.rooms)
  roomType: RoomType;

  @Column({ nullable: true })
  roomTypeId: string;

  @ManyToOne(() => Company)
  company: Company;

  @Column({ nullable: true })
  companyId: string;
}
