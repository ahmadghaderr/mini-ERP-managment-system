import { CreateCustomerOrderItemDto } from './create-customer-order-item.dto';
export declare class CreateCustomerOrderDto {
    fileUrl: string;
    warehouseId: string;
    extractedCustomerName?: string;
    items?: CreateCustomerOrderItemDto[];
}
