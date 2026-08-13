import { Warehouse } from '../../warehouse/entities/warehouse.entity';
import { User } from '../../users/entities/user.entity';
import { CustomerOrderItem } from './customer-order-item.entity';
import { CustomerOrderStatus } from '../../../common/enums';
export declare class CustomerOrder {
    id: string;
    fileUrl: string;
    extractedCustomerName?: string;
    warehouseId: string;
    warehouse: Warehouse;
    status: CustomerOrderStatus;
    uploadedAt: Date;
    confirmedAt?: Date;
    deliveredAt?: Date;
    rejectedAt?: Date;
    reviewedBy?: string;
    reviewer?: User;
    items: CustomerOrderItem[];
}
