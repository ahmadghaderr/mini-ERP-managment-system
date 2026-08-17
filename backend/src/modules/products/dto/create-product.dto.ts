import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  Min,
  MaxLength,
} from 'class-validator';
import { ProductCategory } from '../../../common/enums';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  productName!: string;

  @IsEnum(ProductCategory)
  category!: ProductCategory;

  @IsNumber()
  @Min(0)
  price!: number;
}
