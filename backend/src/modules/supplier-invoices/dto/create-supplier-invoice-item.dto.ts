import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsInt,
  Min,
  IsNumber,
  MaxLength,
} from 'class-validator';

export class CreateSupplierInvoiceItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  extractedProductName!: string;

  @IsOptional()
  @IsUUID()
  matchedProductId?: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;
}
