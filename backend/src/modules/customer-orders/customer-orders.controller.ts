import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  HttpCode,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CustomerOrdersService } from './customer-orders.service';
import { MatchItemDto } from './dto/match-item.dto';
import { Roles } from '../../auth/roles.decorator';
import { RequestWithUser } from '../../auth/types';

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

  @Roles('admin','manager','staff')
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('warehouseId') warehouseId: string,
  ) {
    return this.service.uploadAndExtract(file, warehouseId);
  }

  @Roles('admin','manager','staff')
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
  confirm(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.service.confirm(id, req.user.sub);
  }

  @Roles('admin', 'manager')
  @Patch(':id/deliver')
  deliver(@Param('id') id: string) {
    return this.service.deliver(id);
  }

  @Roles('admin', 'manager')
  @Patch(':id/reject')
  reject(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.service.reject(id, req.user.sub);
  }

  @Roles('admin', 'manager')
  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
