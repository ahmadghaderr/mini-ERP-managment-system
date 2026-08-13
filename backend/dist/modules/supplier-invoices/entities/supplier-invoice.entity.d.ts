import { Warehouse } from '../../warehouse/entities/warehouse.entity';
import { User } from '../../users/entities/user.entity';
import { SupplierInvoiceItem } from './supplier-invoice-item.entity';
import { SupplierInvoiceStatus } from '../../../common/enums';
export declare class SupplierInvoice {
    id: string;
    fileUrl: string;
    extractedSupplierName?: string;
    invoiceDateExtracted?: Date;
    extractedDeliveryDate?: Date;
    warehouseId: string;
    warehouse: Warehouse;
    status: SupplierInvoiceStatus;
    uploadedAt: Date;
    confirmedAt?: Date;
    deliveredAt?: Date;
    reviewedBy?: string;
    reviewer?: User;
    items: SupplierInvoiceItem[];
}
