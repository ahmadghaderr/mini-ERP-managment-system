import { Warehouse } from '../../warehouse/entities/warehouse.entity';
import { Product } from '../../products/entities/product.entity';
import { User } from '../../users/entities/user.entity';
import { StockMovementReason } from '../../../common/enums';
export declare class StockMovement {
    id: string;
    warehouseId: string;
    warehouse: Warehouse;
    productId: string;
    product: Product;
    quantityChange: number;
    reason: StockMovementReason;
    referenceId?: string;
    createdAt: Date;
    createdBy?: string;
    user?: User;
}
