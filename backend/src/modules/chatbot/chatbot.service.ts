import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { ChatSession } from './entities/chat-session.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { User } from '../users/entities/user.entity';

const CHATBOT_AGENT_RUNTIME_ARN =
  'arn:aws:bedrock-agentcore:eu-west-1:767828722131:runtime/chatbot_chatbot-I8i9PqEWZO';
const AGENTCORE_REGION = 'eu-west-1';
const TITLE_MAX_LENGTH = 40;

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);

  constructor(
    @InjectRepository(ChatSession)
    private readonly sessionRepo: Repository<ChatSession>,
    @InjectRepository(ChatMessage)
    private readonly messageRepo: Repository<ChatMessage>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  private async resolveUserId(cognitoSub: string): Promise<string> {
    const user = await this.userRepo.findOne({ where: { cognitoSub } });
    if (!user) {
      throw new BadRequestException('No user found for this identity');
    }
    return user.id;
  }

  private async getOwnedSession(
    cognitoSub: string,
    sessionId: string,
  ): Promise<ChatSession> {
    const userId = await this.resolveUserId(cognitoSub);
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId, userId },
    });
    if (!session) {
      throw new NotFoundException('Chat session not found');
    }
    return session;
  }

  async createSession(cognitoSub: string): Promise<ChatSession> {
    const userId = await this.resolveUserId(cognitoSub);
    const session = this.sessionRepo.create({ userId, title: 'New chat' });
    return this.sessionRepo.save(session);
  }

  async listSessions(cognitoSub: string): Promise<ChatSession[]> {
    const userId = await this.resolveUserId(cognitoSub);
    return this.sessionRepo.find({
      where: { userId },
      order: { updatedAt: 'DESC' },
    });
  }

  async getMessages(cognitoSub: string, sessionId: string): Promise<ChatMessage[]> {
    await this.getOwnedSession(cognitoSub, sessionId);
    return this.messageRepo.find({
      where: { chatSessionId: sessionId },
      order: { createdAt: 'ASC' },
    });
  }

  private parseSseStream(raw: string): string {
    const lines = raw.split('\n').filter((l) => l.trim().startsWith('data:'));
    let text = '';
    for (const line of lines) {
      const jsonStr = line.replace(/^data:\s*/, '').trim();
      if (!jsonStr) continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const delta = parsed?.event?.contentBlockDelta?.delta?.text;
        if (typeof delta === 'string') {
          text += delta;
        }
      } catch {
        // skip malformed/partial chunks
      }
    }
    return text.trim();
  }

  private extractReplyText(raw: string, contentType: string): string {
    if (contentType.includes('text/event-stream')) {
      const parsed = this.parseSseStream(raw);
      return parsed || raw.trim();
    }

    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'string') return parsed;
      if (typeof parsed?.completion === 'string') return parsed.completion;
      if (typeof parsed?.response === 'string') return parsed.response;
      if (typeof parsed?.output === 'string') return parsed.output;
      return raw;
    } catch {
      return raw;
    }
  }

  async sendMessage(
    cognitoSub: string,
    sessionId: string,
    message: string,
    accessToken: string,
  ): Promise<{ reply: string }> {
    const session = await this.getOwnedSession(cognitoSub, sessionId);

    const userMessage = this.messageRepo.create({
      chatSessionId: sessionId,
      role: 'user',
      text: message,
    });
    await this.messageRepo.save(userMessage);

    const encodedArn = encodeURIComponent(CHATBOT_AGENT_RUNTIME_ARN);
    const url = `https://bedrock-agentcore.${AGENTCORE_REGION}.amazonaws.com/runtimes/${encodedArn}/invocations?qualifier=DEFAULT`;

    let reply: string;
    try {
      const response = await axios.post(
        url,
        { prompt: message },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Amzn-Bedrock-AgentCore-Runtime-Session-Id': sessionId,
          },
          responseType: 'text',
          transformResponse: (data) => data,
        },
      );

      const contentType = String(response.headers['content-type'] ?? '');
      const raw = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
      reply = this.extractReplyText(raw, contentType) || 'The chatbot did not return a response.';
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const data = err.response?.data;
        this.logger.error(`Chatbot invocation failed (status ${status}): ${JSON.stringify(data)}`);

        if (status === 401 || status === 403) {
          throw new UnauthorizedException('Not authorized to use the chatbot. Please log in again.');
        }

        const errMessage =
          typeof data === 'string' ? data : data?.message || err.message || 'Chatbot request failed.';
        throw new BadRequestException(errMessage);
      }
      this.logger.error('Unexpected chatbot error', err);
      throw new BadRequestException('Chatbot request failed.');
    }

    const assistantMessage = this.messageRepo.create({
      chatSessionId: sessionId,
      role: 'assistant',
      text: reply,
    });
    await this.messageRepo.save(assistantMessage);

    if (session.title === 'New chat') {
      session.title =
        message.length > TITLE_MAX_LENGTH
          ? `${message.slice(0, TITLE_MAX_LENGTH)}…`
          : message;
    }
    await this.sessionRepo.save(session);

    return { reply };
  }

  async deleteSession(cognitoSub: string, sessionId: string): Promise<void> {
  await this.getOwnedSession(cognitoSub, sessionId);
  await this.sessionRepo.delete({ id: sessionId });
}
}