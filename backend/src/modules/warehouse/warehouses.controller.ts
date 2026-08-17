import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
} from '@nestjs/common';
import { WarehousesService } from './warehouses.service';
import { Warehouse } from './entities/warehouse.entity';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';

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
  create(@Body() data: CreateWarehouseDto) {
    return this.warehousesService.create(data);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: UpdateWarehouseDto) {
    return this.warehousesService.update(id, data);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.warehousesService.remove(id);
  }
}
