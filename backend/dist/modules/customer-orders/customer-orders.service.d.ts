import { Repository, DataSource } from 'typeorm';
import { CustomerOrder } from './entities/customer-order.entity';
import { CustomerOrderItem } from './entities/customer-order-item.entity';
import { CreateCustomerOrderDto } from './dto/create-customer-order.dto';
export declare class CustomerOrdersService {
    private readonly orderRepo;
    private readonly itemRepo;
    private readonly dataSource;
    constructor(orderRepo: Repository<CustomerOrder>, itemRepo: Repository<CustomerOrderItem>, dataSource: DataSource);
    findAll(): Promise<CustomerOrder[]>;
    findOne(id: string): Promise<CustomerOrder>;
    create(data: CreateCustomerOrderDto): Promise<CustomerOrder>;
    matchItem(orderId: string, itemId: string, matchedProductId: string): Promise<CustomerOrderItem>;
    confirm(id: string, reviewedBy?: string): Promise<CustomerOrder>;
    deliver(id: string): Promise<CustomerOrder>;
    reject(id: string, reviewedBy?: string): Promise<CustomerOrder>;
    remove(id: string): Promise<void>;
}
