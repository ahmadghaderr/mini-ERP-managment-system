import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  MaxLength,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateCustomerOrderItemDto } from './create-customer-order-item.dto';

export class CreateCustomerOrderDto {
  @IsString()
  @IsNotEmpty()
  fileUrl!: string;

  @IsUUID()
  warehouseId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  extractedCustomerName?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCustomerOrderItemDto)
  items?: CreateCustomerOrderItemDto[];
}
