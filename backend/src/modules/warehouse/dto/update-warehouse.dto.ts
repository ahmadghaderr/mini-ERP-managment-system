import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';

export class UpdateWarehouseDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  warehouseName?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  warehouseLocation?: string;
}