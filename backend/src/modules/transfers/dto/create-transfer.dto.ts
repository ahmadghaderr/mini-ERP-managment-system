import { IsUUID, IsInt, Min, IsOptional, IsString } from 'class-validator';

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
  @IsString()
  createdBy?: string;
}
