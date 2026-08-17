import { Warehouse } from '../../warehouse/entities/warehouse.entity';
import { Product } from '../../products/entities/product.entity';
export declare class WarehouseProduct {
    id: string;
    warehouseId: string;
    warehouse: Warehouse;
    productId: string;
    product: Product;
    quantityOnHand: number;
    quantityReserved: number;
    updatedAt: Date;
}
