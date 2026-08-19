import { Controller, Get, Post, Body } from '@nestjs/common';
import { StockService } from './stock.service';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { Roles } from '../../auth/roles.decorator';

@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Roles('manager', 'staff')
  @Get('movements')
  findAllMovements() {
    return this.stockService.findAllMovements();
  }

  @Roles('manager', 'staff')
  @Get('levels')
  findAllStock() {
    return this.stockService.findAllStock();
  }

  @Roles('manager')
  @Post('adjustments')
  adjustStock(@Body() dto: AdjustStockDto) {
    return this.stockService.adjustStock(dto);
  }
}
