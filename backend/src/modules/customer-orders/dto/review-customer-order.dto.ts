import { IsOptional, IsUUID } from 'class-validator';

export class ReviewCustomerOrderDto {
  @IsOptional()
  @IsUUID()
  reviewedBy?: string;
}
