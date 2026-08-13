import { Product } from '../../products/entities/product.entity';
import { Warehouse } from '../../warehouse/entities/warehouse.entity';
import { User } from '../../users/entities/user.entity';
export declare class WarehouseTransfer {
    id: string;
    productId: string;
    product: Product;
    fromWarehouseId: string;
    fromWarehouse: Warehouse;
    toWarehouseId: string;
    toWarehouse: Warehouse;
    quantity: number;
    createdAt: Date;
    createdBy?: string;
    user?: User;
}
