import { Repository, DataSource } from 'typeorm';
import { CustomerOrder } from './entities/customer-order.entity';
import { CustomerOrderItem } from './entities/customer-order-item.entity';
interface ItemInput {
    extractedProductName: string;
    matchedProductId?: string;
    quantity: number;
    unitPrice?: number;
}
export declare class CustomerOrdersService {
    private readonly orderRepo;
    private readonly itemRepo;
    private readonly dataSource;
    constructor(orderRepo: Repository<CustomerOrder>, itemRepo: Repository<CustomerOrderItem>, dataSource: DataSource);
    findAll(): Promise<CustomerOrder[]>;
    findOne(id: string): Promise<CustomerOrder>;
    create(data: {
        fileUrl: string;
        warehouseId: string;
        extractedCustomerName?: string;
        items?: ItemInput[];
    }): Promise<CustomerOrder>;
    confirm(id: string, reviewedBy?: string): Promise<CustomerOrder>;
    deliver(id: string): Promise<CustomerOrder>;
    reject(id: string, reviewedBy?: string): Promise<CustomerOrder>;
    remove(id: string): Promise<void>;
}
export {};
