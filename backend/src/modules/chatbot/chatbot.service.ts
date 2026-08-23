import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface ChatbotReply {
  reply: string;
}

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);
  private readonly agentRuntimeArn: string;
  private readonly region: string;

  constructor(private readonly configService: ConfigService) {
    this.agentRuntimeArn = this.configService.getOrThrow<string>(
      'CHATBOT_AGENT_RUNTIME_ARN',
    );
    this.region = this.configService.getOrThrow<string>('AGENTCORE_REGION');
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
    message: string,
    sessionId: string,
    accessToken: string,
  ): Promise<ChatbotReply> {
    const encodedArn = encodeURIComponent(this.agentRuntimeArn);
    const url = `https://bedrock-agentcore.${this.region}.amazonaws.com/runtimes/${encodedArn}/invocations?qualifier=DEFAULT`;

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
      const reply = this.extractReplyText(raw, contentType);

      this.logger.log(`Chatbot replied for session ${sessionId}`);
      return { reply: reply || 'The chatbot did not return a response.' };
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const data = err.response?.data;
        this.logger.error(
          `Chatbot invocation failed (status ${status}): ${JSON.stringify(data)}`,
        );

        if (status === 401 || status === 403) {
          throw new UnauthorizedException(
            'Not authorized to use the chatbot. Please log in again.',
          );
        }

        const message =
          typeof data === 'string'
            ? data
            : data?.message || err.message || 'Chatbot request failed.';
        throw new BadRequestException(message);
      }

      this.logger.error('Unexpected chatbot error', err);
      throw new BadRequestException('Chatbot request failed.');
    }
  }
}