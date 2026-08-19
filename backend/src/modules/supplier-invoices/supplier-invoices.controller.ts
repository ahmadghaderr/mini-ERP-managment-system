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
import { SupplierInvoicesService } from './supplier-invoices.service';
import { CreateSupplierInvoiceDto } from './dto/create-supplier-invoice.dto';
import { ReviewSupplierInvoiceDto } from './dto/review-supplier-invoice.dto';
import { MatchItemDto } from './dto/match-item.dto';
import { Roles } from '../../auth/roles.decorator';

@Controller('supplier-invoices')
export class SupplierInvoicesController {
  constructor(private readonly service: SupplierInvoicesService) {}

  @Roles('manager', 'staff')
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Roles('manager', 'staff')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles('manager', 'staff')
  @Post()
  create(@Body() data: CreateSupplierInvoiceDto) {
    return this.service.create(data);
  }

  @Roles('manager', 'staff')
  @Patch(':invoiceId/items/:itemId/match')
  matchItem(
    @Param('invoiceId') invoiceId: string,
    @Param('itemId') itemId: string,
    @Body() dto: MatchItemDto,
  ) {
    return this.service.matchItem(invoiceId, itemId, dto.matchedProductId);
  }

  @Roles('manager')
  @Patch(':id/confirm')
  confirm(@Param('id') id: string, @Body() body: ReviewSupplierInvoiceDto) {
    return this.service.confirm(id, body?.reviewedBy);
  }

  @Roles('manager')
  @Patch(':id/reject')
  reject(@Param('id') id: string, @Body() body: ReviewSupplierInvoiceDto) {
    return this.service.reject(id, body?.reviewedBy);
  }

  @Roles('manager')
  @Patch(':id/deliver')
  deliver(@Param('id') id: string) {
    return this.service.deliver(id);
  }

  @Roles('manager')
  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
