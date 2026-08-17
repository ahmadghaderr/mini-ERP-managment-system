import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateWarehouseDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  warehouseName !: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  warehouseLocation !: string;
}