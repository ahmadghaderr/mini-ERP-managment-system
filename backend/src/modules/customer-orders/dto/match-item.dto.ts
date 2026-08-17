import { IsUUID } from 'class-validator';

export class MatchItemDto {
  @IsUUID()
  matchedProductId!: string;
}
