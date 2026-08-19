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
import { CustomerOrdersService } from './customer-orders.service';
import { CreateCustomerOrderDto } from './dto/create-customer-order.dto';
import { ReviewCustomerOrderDto } from './dto/review-customer-order.dto';
import { MatchItemDto } from './dto/match-item.dto';
import { Roles } from '../../auth/roles.decorator';

@Controller('customer-orders')
export class CustomerOrdersController {
  constructor(private readonly service: CustomerOrdersService) {}

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

  @Roles('admin', 'staff')
  @Post()
  create(@Body() data: CreateCustomerOrderDto) {
    return this.service.create(data);
  }

  @Roles('admin', 'staff')
  @Patch(':orderId/items/:itemId/match')
  matchItem(
    @Param('orderId') orderId: string,
    @Param('itemId') itemId: string,
    @Body() dto: MatchItemDto,
  ) {
    return this.service.matchItem(orderId, itemId, dto.matchedProductId);
  }

  @Roles('admin', 'manager')
  @Patch(':id/confirm')
  confirm(@Param('id') id: string, @Body() body: ReviewCustomerOrderDto) {
    return this.service.confirm(id, body?.reviewedBy);
  }

  @Roles('admin', 'manager')
  @Patch(':id/deliver')
  deliver(@Param('id') id: string) {
    return this.service.deliver(id);
  }

  @Roles('admin', 'manager')
  @Patch(':id/reject')
  reject(@Param('id') id: string, @Body() body: ReviewCustomerOrderDto) {
    return this.service.reject(id, body?.reviewedBy);
  }

  @Roles('admin', 'manager')
  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
