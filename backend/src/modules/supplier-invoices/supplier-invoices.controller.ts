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
  create(@Body() data: CreateSupplierInvoiceDto) {
    return this.service.create(data);
  }

  @Patch(':invoiceId/items/:itemId/match')
  matchItem(
    @Param('invoiceId') invoiceId: string,
    @Param('itemId') itemId: string,
    @Body() dto: MatchItemDto,
  ) {
    return this.service.matchItem(invoiceId, itemId, dto.matchedProductId);
  }

  @Patch(':id/confirm')
  confirm(@Param('id') id: string, @Body() body: ReviewSupplierInvoiceDto) {
    return this.service.confirm(id, body?.reviewedBy);
  }

  @Patch(':id/reject')
  reject(@Param('id') id: string, @Body() body: ReviewSupplierInvoiceDto) {
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
