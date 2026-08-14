import { Controller, Get } from '@nestjs/common';
import { StockService } from './stock.service';

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
}