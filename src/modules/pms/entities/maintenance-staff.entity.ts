import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseAuditEntity } from '../../../common/entities/base.entity';
import { Company } from '../../accounting/entities/company.entity';

export enum MaintenanceStaffRole {
  TECHNICIAN = 'TECHNICIAN',
  SUPERVISOR = 'SUPERVISOR',
}

@Entity('maintenance_staff')
export class MaintenanceStaff extends BaseAuditEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({
    type: 'enum',
    enum: MaintenanceStaffRole,
    default: MaintenanceStaffRole.TECHNICIAN,
  })
  role: MaintenanceStaffRole;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => Company)
  company: Company;

  @Column({ nullable: true })
  companyId: string;
}
