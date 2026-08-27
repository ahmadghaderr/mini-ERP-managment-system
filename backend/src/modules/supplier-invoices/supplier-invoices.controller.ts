import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SupplierInvoicesService } from './supplier-invoices.service';
import { CreateSupplierInvoiceDto } from './dto/create-supplier-invoice.dto';
import { ReviewSupplierInvoiceDto } from './dto/review-supplier-invoice.dto';
import { MatchItemDto } from './dto/match-item.dto';
import { UpdateItemPriceDto } from './dto/update-item-price.dto';
import { Roles } from '../../auth/roles.decorator';

@Controller('supplier-invoices')
export class SupplierInvoicesController {
  constructor(private readonly service: SupplierInvoicesService) {}

  @Roles('admin', 'manager', 'staff')
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Roles('admin', 'manager', 'staff')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles('admin', 'manager',)
  @Post()
  create(@Body() data: CreateSupplierInvoiceDto) {
    return this.service.create(data);
  }

  @Roles('admin', 'manager')
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('warehouseId') warehouseId: string,
  ) {
    return this.service.uploadAndExtract(file, warehouseId);
  }

  @Roles('admin', 'manager')
  @Patch(':invoiceId/items/:itemId/match')
  matchItem(
    @Param('invoiceId') invoiceId: string,
    @Param('itemId') itemId: string,
    @Body() dto: MatchItemDto,
  ) {
    return this.service.matchItem(invoiceId, itemId, dto.matchedProductId);
  }

  @Roles('admin', 'manager')
  @Patch(':invoiceId/items/:itemId/price')
  updateItemPrice(
    @Param('invoiceId') invoiceId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateItemPriceDto,
  ) {
    return this.service.updateItemPrice(invoiceId, itemId, dto.unitPrice);
  }

  @Roles('admin', 'manager')
  @Patch(':id/confirm')
  confirm(@Param('id') id: string, @Body() body: ReviewSupplierInvoiceDto) {
    return this.service.confirm(id, body?.reviewedBy);
  }

  @Roles('admin', 'manager')
  @Patch(':id/reject')
  reject(@Param('id') id: string, @Body() body: ReviewSupplierInvoiceDto) {
    return this.service.reject(id, body?.reviewedBy);
  }

  @Roles('admin', 'manager')
  @Patch(':id/deliver')
  deliver(@Param('id') id: string) {
    return this.service.deliver(id);
  }

  @Roles('admin', 'manager')
  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}