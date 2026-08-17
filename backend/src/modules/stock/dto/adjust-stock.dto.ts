import { IsUUID, IsInt, IsOptional, NotEquals } from 'class-validator';

export class AdjustStockDto {
  @IsUUID()
  warehouseId!: string;

  @IsUUID()
  productId!: string;

  @IsInt()
  @NotEquals(0)
  quantityChange!: number;

  @IsOptional()
  @IsUUID()
  createdBy?: string;
}
