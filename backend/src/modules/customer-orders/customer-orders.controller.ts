import {
  Controller, Get, Post, Patch, Delete, Param, Body, HttpCode,
} from '@nestjs/common';
import { CustomerOrdersService } from './customer-orders.service';

@Controller('customer-orders')
export class CustomerOrdersController {
  constructor(private readonly service: CustomerOrdersService) {}

  @Get()
  findAll() { return this.service.findAll(); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Post()
  create(@Body() data: any) { return this.service.create(data); }

  @Patch(':id/confirm')
  confirm(@Param('id') id: string, @Body() body: { reviewedBy?: string }) {
    return this.service.confirm(id, body?.reviewedBy);
  }

  @Patch(':id/deliver')
  deliver(@Param('id') id: string) { return this.service.deliver(id); }

  @Patch(':id/reject')
  reject(@Param('id') id: string, @Body() body: { reviewedBy?: string }) {
    return this.service.reject(id, body?.reviewedBy);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string) { return this.service.remove(id); }
}