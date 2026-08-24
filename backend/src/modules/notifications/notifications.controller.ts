import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { SubscribeDto } from './dto/subscribe.dto';
import { Roles } from '../../auth/roles.decorator';
import { RequestWithUser } from '../../auth/types';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Roles('admin', 'manager', 'staff')
  @Get('vapid-public-key')
  getPublicKey() {
    return { publicKey: this.notificationsService.getPublicKey() };
  }

  @Roles('admin', 'manager', 'staff')
  @Post('subscribe')
  subscribe(@Body() dto: SubscribeDto, @Req() req: RequestWithUser) {
    return this.notificationsService.subscribe(req.user.sub, dto);
  }

  @Roles('admin', 'manager', 'staff')
  @Delete('subscribe')
  unsubscribe(@Body('endpoint') endpoint: string) {
    return this.notificationsService.unsubscribe(endpoint);
  }

  @Roles('admin', 'manager', 'staff')
  @Get()
  findMine(@Req() req: RequestWithUser) {
    return this.notificationsService.findMyNotifications(req.user.sub);
  }

  @Roles('admin', 'manager', 'staff')
  @Patch(':id/read')
  markRead(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.notificationsService.markRead(req.user.sub, id);
  }

  @Roles('admin', 'manager', 'staff')
  @Patch('read-all')
  markAllRead(@Req() req: RequestWithUser) {
    return this.notificationsService.markAllRead(req.user.sub);
  }
}