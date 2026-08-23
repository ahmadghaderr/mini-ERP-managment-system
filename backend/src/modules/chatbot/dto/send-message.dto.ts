import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  message!: string;

  @IsString()
  @MinLength(33)
  sessionId!: string;
}