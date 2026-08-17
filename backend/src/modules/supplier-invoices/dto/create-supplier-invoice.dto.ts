import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsDateString,
  MaxLength,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateSupplierInvoiceItemDto } from './create-supplier-invoice-item.dto';

export class CreateSupplierInvoiceDto {
  @IsString()
  @IsNotEmpty()
  fileUrl!: string;

  @IsUUID()
  warehouseId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  extractedSupplierName?: string;

  @IsOptional()
  @IsDateString()
  invoiceDateExtracted?: string;

  @IsOptional()
  @IsDateString()
  extractedDeliveryDate?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSupplierInvoiceItemDto)
  items?: CreateSupplierInvoiceItemDto[];
}
