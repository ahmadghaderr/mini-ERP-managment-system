import { CustomerOrder } from './customer-order.entity';
import { Product } from '../../products/entities/product.entity';
export declare class CustomerOrderItem {
    id: string;
    customerOrderId: string;
    customerOrder: CustomerOrder;
    extractedProductName: string;
    matchedProductId?: string;
    matchedProduct?: Product;
    quantity: number;
    unitPrice?: number;
}
