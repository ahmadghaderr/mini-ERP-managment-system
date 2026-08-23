import {
  Controller,
  Post,
  Body,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { ChatbotService, ChatbotReply } from './chatbot.service';
import { SendMessageDto } from './dto/send-message.dto';
import { Roles } from '../../auth/roles.decorator';

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Roles('admin', 'manager', 'staff')
  @Post('message')
  async sendMessage(
    @Body() dto: SendMessageDto,
    @Req() req: Request,
  ): Promise<ChatbotReply> {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or malformed Authorization header');
    }
    const accessToken = authHeader.slice('Bearer '.length);

    return this.chatbotService.sendMessage(dto.message, dto.sessionId, accessToken);
  }
}