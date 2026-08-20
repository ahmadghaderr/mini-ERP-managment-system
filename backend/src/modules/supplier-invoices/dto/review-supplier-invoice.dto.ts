import { IsOptional, IsUUID } from 'class-validator';

export class ReviewSupplierInvoiceDto {
  @IsOptional()
  @IsUUID()
  reviewedBy?: string;
}