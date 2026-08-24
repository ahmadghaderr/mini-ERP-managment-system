import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { ChatbotService } from './chatbot.service';
import { SendMessageDto } from './dto/send-message.dto';
import { Roles } from '../../auth/roles.decorator';
import { RequestWithUser } from '../../auth/types';
import { Delete } from '@nestjs/common';

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Roles('admin', 'manager', 'staff')
  @Post('sessions')
  createSession(@Req() req: RequestWithUser) {
    return this.chatbotService.createSession(req.user.sub);
  }

  @Roles('admin', 'manager', 'staff')
  @Get('sessions')
  listSessions(@Req() req: RequestWithUser) {
    return this.chatbotService.listSessions(req.user.sub);
  }

  @Roles('admin', 'manager', 'staff')
  @Get('sessions/:id/messages')
  getMessages(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.chatbotService.getMessages(req.user.sub, id);
  }

  @Roles('admin', 'manager', 'staff')
  @Post('sessions/:id/messages')
  async sendMessage(
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
    @Req() req: RequestWithUser & Request,
  ) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or malformed Authorization header');
    }
    const accessToken = authHeader.slice('Bearer '.length);

    return this.chatbotService.sendMessage(req.user.sub, id, dto.message, accessToken);
  }
  @Roles('admin', 'manager', 'staff')
@Delete('sessions/:id')
deleteSession(@Param('id') id: string, @Req() req: RequestWithUser) {
  return this.chatbotService.deleteSession(req.user.sub, id);
}
}