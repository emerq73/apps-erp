import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseAuditEntity } from '../../../common/entities/base.entity';
import { User } from '../../auth/entities/user.entity';
import { ThirdParty } from '../../accounting/entities/third-party.entity';

export enum SaleStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentMethodPOS {
  CASH = 'CASH',
  CARD = 'CARD',
  TRANSFER = 'TRANSFER',
  CREDIT = 'CREDIT',
}

@Entity('pos_sales')
export class Sale extends BaseAuditEntity {
  @Column({ unique: true })
  saleNumber: string;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  total: number;

  @Column({ type: 'enum', enum: SaleStatus, default: SaleStatus.PENDING })
  status: SaleStatus;

  @Column({ type: 'enum', enum: PaymentMethodPOS, nullable: true })
  paymentMethod: PaymentMethodPOS;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  cashReceived: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  change: number;

  @Column({ nullable: true })
  notes: string;

  @ManyToOne(() => User)
  seller: User;

  @Column({ nullable: true })
  sellerId: string;

  @ManyToOne(() => ThirdParty)
  customer: ThirdParty;

  @Column({ nullable: true })
  customerId: string;

  @CreateDateColumn()
  declare createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date;

  @OneToMany(() => SaleItem, (item) => item.sale, { cascade: true })
  items: SaleItem[];
}

@Entity('pos_sale_items')
export class SaleItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  productName: string;

  @Column({ nullable: true })
  productCode: string;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  quantity: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  discount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  total: number;

  @ManyToOne(() => Sale, (sale) => sale.items)
  sale: Sale;

  @Column({ nullable: true })
  saleId: string;
}

@Entity('pos_products')
export class PosProduct extends BaseAuditEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  code: string;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  cost: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  taxRate: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  barcode: string;

  @Column({ nullable: true })
  stock: number;

  @Column({ default: false })
  trackInventory: boolean;
}
