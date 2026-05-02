import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseAuditEntity } from '../../../common/entities/base.entity';
import { Company } from '../../accounting/entities/company.entity';

export enum StaffRole {
  HOUSEKEEPER = 'HOUSEKEEPER',
  SUPERVISOR = 'SUPERVISOR',
  TECHNICIAN = 'TECHNICIAN',
}

@Entity('housekeeping_staff')
export class HousekeepingStaff extends BaseAuditEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({
    type: 'enum',
    enum: StaffRole,
    default: StaffRole.HOUSEKEEPER,
  })
  role: StaffRole;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => Company)
  company: Company;

  @Column({ nullable: true })
  companyId: string;
}
