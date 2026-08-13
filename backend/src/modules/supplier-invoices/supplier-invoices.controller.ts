import {
  Controller, Get, Post, Patch, Delete, Param, Body, HttpCode,
} from '@nestjs/common';
import { SupplierInvoicesService } from './supplier-invoices.service';

@Controller('supplier-invoices')
export class SupplierInvoicesController {
  constructor(private readonly service: SupplierInvoicesService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() data: any) {
    return this.service.create(data);
  }

  // status actions — POST to a sub-path
  @Patch(':id/confirm')
  confirm(@Param('id') id: string, @Body() body: { reviewedBy?: string }) {
    return this.service.confirm(id, body?.reviewedBy);
  }

  @Patch(':id/reject')
  reject(@Param('id') id: string, @Body() body: { reviewedBy?: string }) {
    return this.service.reject(id, body?.reviewedBy);
  }

  @Patch(':id/deliver')
  deliver(@Param('id') id: string) {
    return this.service.deliver(id);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}