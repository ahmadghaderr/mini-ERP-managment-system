import { Controller, Get, Post, Body } from '@nestjs/common';
import { TransfersService } from './transfers.service';

@Controller('transfers')
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  @Get()
  findAll() {
    return this.transfersService.findAll();
  }

  @Post()
  create(@Body() data: any) {
    return this.transfersService.create(data);
  }
}