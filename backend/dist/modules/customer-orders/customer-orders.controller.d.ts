import { CustomerOrdersService } from './customer-orders.service';
import { CreateCustomerOrderDto } from './dto/create-customer-order.dto';
import { ReviewCustomerOrderDto } from './dto/review-customer-order.dto';
import { MatchItemDto } from './dto/match-item.dto';
export declare class CustomerOrdersController {
    private readonly service;
    constructor(service: CustomerOrdersService);
    findAll(): Promise<import("./entities/customer-order.entity").CustomerOrder[]>;
    findOne(id: string): Promise<import("./entities/customer-order.entity").CustomerOrder>;
    create(data: CreateCustomerOrderDto): Promise<import("./entities/customer-order.entity").CustomerOrder>;
    matchItem(orderId: string, itemId: string, dto: MatchItemDto): Promise<import("./entities/customer-order-item.entity").CustomerOrderItem>;
    confirm(id: string, body: ReviewCustomerOrderDto): Promise<import("./entities/customer-order.entity").CustomerOrder>;
    deliver(id: string): Promise<import("./entities/customer-order.entity").CustomerOrder>;
    reject(id: string, body: ReviewCustomerOrderDto): Promise<import("./entities/customer-order.entity").CustomerOrder>;
    remove(id: string): Promise<void>;
}
