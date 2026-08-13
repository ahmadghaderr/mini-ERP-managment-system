import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, HttpCode,
} from '@nestjs/common';
import { WarehousesService } from './warehouses.service';
import { Warehouse } from './entities/warehouse.entity';

@Controller('warehouses')
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Get()
  findAll() {
    return this.warehousesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.warehousesService.findOne(id);
  }

  @Post()
  create(@Body() data: Partial<Warehouse>) {
    return this.warehousesService.create(data);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: Partial<Warehouse>) {
    return this.warehousesService.update(id, data);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.warehousesService.remove(id);
  }
}