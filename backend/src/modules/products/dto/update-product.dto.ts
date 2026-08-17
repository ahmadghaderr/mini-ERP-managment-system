import { IsString, IsNotEmpty, IsEnum, IsNumber, Min, MaxLength, IsOptional } from 'class-validator';
import { ProductCategory } from '../../../common/enums';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  productName?: string;

  @IsOptional()
  @IsEnum(ProductCategory)
  category?: ProductCategory;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;
}