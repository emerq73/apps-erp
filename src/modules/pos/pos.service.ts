import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sale, SaleItem, PosProduct, SaleStatus, PaymentMethodPOS } from './entities/sale.entity';
import { AccountingService } from '../accounting/accounting.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PosService {
    constructor(
        @InjectRepository(Sale) private saleRepo: Repository<Sale>,
        @InjectRepository(SaleItem) private itemRepo: Repository<SaleItem>,
        @InjectRepository(PosProduct) private productRepo: Repository<PosProduct>,
    ) {}

    private generateSaleNumber(): string {
        const date = new Date();
        const num = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `POS-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}-${num}`;
    }

    async createSale(data: { items: { productId: string; quantity: number }[]; sellerId: string; customerId?: string }, companyId: string) {
        let subtotal = 0;
        const saleItems: SaleItem[] = [];

        for (const item of data.items) {
            const product = await this.productRepo.findOneBy({ id: item.productId });
            if (!product) throw new Error(`Producto no encontrado: ${item.productId}`);

            const total = Number(product.price) * item.quantity;
            subtotal += total;

            saleItems.push(this.itemRepo.create({
                productName: product.name,
                productCode: product.code,
                unitPrice: product.price,
                quantity: item.quantity,
                discount: 0,
                total
            }));
        }

        const taxAmount = subtotal * 0.19;
        const total = subtotal + taxAmount;

        const sale = this.saleRepo.create({
            saleNumber: this.generateSaleNumber(),
            subtotal,
            taxAmount,
            discount: 0,
            total,
            status: SaleStatus.PENDING,
            sellerId: data.sellerId,
            customerId: data.customerId,
            items: saleItems
        } as any);

        return this.saleRepo.save(sale);
    }

    async completeSale(saleId: string, data: { paymentMethod: PaymentMethodPOS; cashReceived: number; notes?: string }) {
        const sale = await this.saleRepo.findOne({ 
            where: { id: saleId },
            relations: ['items']
        });
        if (!sale) throw new Error('Venta no encontrada');

        const change = Number(data.cashReceived) - Number(sale.total);
        
        sale.status = SaleStatus.PAID;
        sale.paymentMethod = data.paymentMethod;
        sale.cashReceived = Number(data.cashReceived);
        sale.change = change > 0 ? change : 0;
        sale.notes = data.notes || '';
        sale.paidAt = new Date();

        await this.saleRepo.save(sale);

        try {
            await this.createAccountingEntry(sale);
        } catch (e) {
            console.error('Error creating accounting entry:', e);
        }

        return sale;
    }

    private async createAccountingEntry(sale: Sale) {
        return { saleNumber: sale.saleNumber };
    }

    async cancelSale(saleId: string) {
        const sale = await this.saleRepo.findOne({ where: { id: saleId } });
        if (!sale) throw new Error('Venta no encontrada');
        if (sale.status === SaleStatus.PAID) throw new Error('No se puede cancelar una venta pagada');

        sale.status = SaleStatus.CANCELLED;
        return this.saleRepo.save(sale);
    }

    async getSales(status?: string, startDate?: string, endDate?: string) {
        const where: any = {};
        if (status) where.status = status;
        
        return this.saleRepo.find({
            where,
            relations: ['items'],
            order: { createdAt: 'DESC' }
        });
    }

    async getSaleById(id: string) {
        return this.saleRepo.findOne({ where: { id }, relations: ['items'] });
    }

    async getDailySummary(date?: string) {
        const targetDate = date ? new Date(date) : new Date();
        targetDate.setHours(0, 0, 0, 0);
        const endDate = new Date(targetDate);
        endDate.setDate(endDate.getDate() + 1);

        const sales = await this.saleRepo.find({
            where: {
                status: SaleStatus.PAID,
            }
        });

        const todaySales = sales.filter(s => s.createdAt >= targetDate && s.createdAt < endDate);
        
        const totalCash = todaySales.filter(s => s.paymentMethod === PaymentMethodPOS.CASH).reduce((sum, s) => sum + Number(s.total), 0);
        const totalCard = todaySales.filter(s => s.paymentMethod === PaymentMethodPOS.CARD).reduce((sum, s) => sum + Number(s.total), 0);
        const totalTransfer = todaySales.filter(s => s.paymentMethod === PaymentMethodPOS.TRANSFER).reduce((sum, s) => sum + Number(s.total), 0);

        return {
            date: targetDate.toISOString().split('T')[0],
            totalSales: todaySales.length,
            totalRevenue: totalCash + totalCard + totalTransfer,
            byPaymentMethod: {
                cash: totalCash,
                card: totalCard,
                transfer: totalTransfer
            }
        };
    }

    async createProduct(data: any) {
        const product = this.productRepo.create(data);
        return this.productRepo.save(product);
    }

    async getProducts(category?: string) {
        const where: any = { isActive: true };
        if (category) where.category = category;
        return this.productRepo.find({ where, order: { name: 'ASC' } });
    }

    async updateProduct(id: string, data: any) {
        await this.productRepo.update(id, data);
        return this.productRepo.findOneBy({ id });
    }

    async getProductByBarcode(barcode: string) {
        return this.productRepo.findOne({ where: { barcode } });
    }

    async seedProducts() {
        const products = [
            { name: 'Cerveza Nacional', code: 'CER001', price: 2500, cost: 1500, category: 'Bebidas', barcode: '1234567890123', stock: 100 },
            { name: 'Cerveza Importada', code: 'CER002', price: 4500, cost: 2500, category: 'Bebidas', barcode: '1234567890124', stock: 50 },
            { name: 'Gaseosa', code: 'GAS001', price: 2000, cost: 800, category: 'Bebidas', barcode: '1234567890125', stock: 200 },
            { name: 'Agua Mineral', code: 'AGU001', price: 1500, cost: 500, category: 'Bebidas', barcode: '1234567890126', stock: 150 },
            { name: 'Hamburguesa Simple', code: 'HAM001', price: 12000, cost: 5000, category: 'Comidas', barcode: '2234567890123', stock: 30 },
            { name: 'Hamburguesa Doble', code: 'HAM002', price: 18000, cost: 7000, category: 'Comidas', barcode: '2234567890124', stock: 20 },
            { name: 'Punta de Añjo', code: 'CAR001', price: 25000, cost: 15000, category: 'Carnes', barcode: '3234567890123', stock: 15 },
            { name: 'Chaufa', code: 'ARC001', price: 15000, cost: 6000, category: 'Comidas', barcode: '4234567890123', stock: 25 },
            { name: 'Salchipapa', code: 'SAL001', price: 10000, cost: 4000, category: 'Comidas', barcode: '4234567890124', stock: 20 },
            { name: 'Ceviche', code: 'CEV001', price: 18000, cost: 8000, category: 'Mariscos', barcode: '5234567890123', stock: 10 },
            { name: 'Pisco Sour', code: 'PIS001', price: 12000, cost: 4000, category: 'Bebidas', barcode: '6234567890123', stock: 20 },
            { name: 'Cuba Libre', code: 'CUB001', price: 8000, cost: 2000, category: 'Bebidas', barcode: '6234567890124', stock: 25 },
        ];
        const created: PosProduct[] = [];
        for (const p of products) {
            const existing = await this.productRepo.findOne({ where: { code: p.code } });
            if (!existing) {
                const product = this.productRepo.create(p);
                created.push(await this.productRepo.save(product));
            }
        }
        return { message: `Created ${created.length} products`, products: created };
    }
}