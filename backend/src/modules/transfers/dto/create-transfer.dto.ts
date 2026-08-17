import { IsUUID, IsInt, Min, IsOptional } from 'class-validator';

export class CreateTransferDto {
  @IsUUID()
  productId!: string;

  @IsUUID()
  fromWarehouseId!: string;

  @IsUUID()
  toWarehouseId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsUUID()
  createdBy?: string;
}
