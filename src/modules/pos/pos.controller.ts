import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PosService } from './pos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { PaymentMethodPOS } from './entities/sale.entity';

@ApiTags('POS')
@ApiBearerAuth()
@Controller('pos')
@UseGuards(JwtAuthGuard)
export class PosController {
  constructor(private readonly posService: PosService) {}

  private getCompanyId(req: any): string {
    return req.headers['x-company-id'] || req.companyId;
  }

  @Post('sales')
  @ApiOperation({ summary: 'Create new sale' })
  async createSale(
    @Req() req: any,
    @Body()
    body: {
      items: { productId: string; quantity: number }[];
      sellerId: string;
      customerId?: string;
    },
  ) {
    const companyId = this.getCompanyId(req);
    return this.posService.createSale(body, companyId);
  }

  @Post('sales/:id/complete')
  @ApiOperation({ summary: 'Complete sale with payment' })
  async completeSale(
    @Param('id') id: string,
    @Body()
    body: {
      paymentMethod: PaymentMethodPOS;
      cashReceived: number;
      notes?: string;
    },
  ) {
    return this.posService.completeSale(id, body);
  }

  @Post('sales/:id/cancel')
  @ApiOperation({ summary: 'Cancel sale' })
  async cancelSale(@Param('id') id: string) {
    return this.posService.cancelSale(id);
  }

  @Get('sales')
  @ApiOperation({ summary: 'Get sales' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getSales(
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.posService.getSales(status, startDate, endDate);
  }

  @Get('sales/:id')
  @ApiOperation({ summary: 'Get sale by ID' })
  async getSaleById(@Param('id') id: string) {
    return this.posService.getSaleById(id);
  }

  @Get('sales/daily-summary')
  @ApiOperation({ summary: 'Get daily sales summary' })
  @ApiQuery({ name: 'date', required: false })
  async getDailySummary(@Query('date') date?: string) {
    return this.posService.getDailySummary(date);
  }

  @Post('products')
  @ApiOperation({ summary: 'Create product' })
  async createProduct(@Body() body: any) {
    return this.posService.createProduct(body);
  }

  @Get('products')
  @ApiOperation({ summary: 'Get products' })
  @ApiQuery({ name: 'category', required: false })
  async getProducts(@Query('category') category?: string) {
    return this.posService.getProducts(category);
  }

  @Put('products/:id')
  @ApiOperation({ summary: 'Update product' })
  async updateProduct(@Param('id') id: string, @Body() body: any) {
    return this.posService.updateProduct(id, body);
  }

  @Get('products/barcode/:barcode')
  @ApiOperation({ summary: 'Get product by barcode' })
  async getProductByBarcode(@Param('barcode') barcode: string) {
    return this.posService.getProductByBarcode(barcode);
  }

  @Post('products/seed')
  @ApiOperation({ summary: 'Seed sample products' })
  async seedProducts() {
    return this.posService.seedProducts();
  }
}
