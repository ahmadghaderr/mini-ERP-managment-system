import { Controller, Get, Post, Body } from '@nestjs/common';
import { StockService } from './stock.service';
import { AdjustStockDto } from './dto/adjust-stock.dto';

@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get('movements')
  findAllMovements() {
    return this.stockService.findAllMovements();
  }

  @Get('levels')
  findAllStock() {
    return this.stockService.findAllStock();
  }

  @Post('adjustments')
  adjustStock(@Body() dto: AdjustStockDto) {
    return this.stockService.adjustStock(dto);
  }
}
