import { CustomerOrdersService } from './customer-orders.service';
export declare class CustomerOrdersController {
    private readonly service;
    constructor(service: CustomerOrdersService);
    findAll(): Promise<import("./entities/customer-order.entity").CustomerOrder[]>;
    findOne(id: string): Promise<import("./entities/customer-order.entity").CustomerOrder>;
    create(data: any): Promise<import("./entities/customer-order.entity").CustomerOrder>;
    confirm(id: string, body: {
        reviewedBy?: string;
    }): Promise<import("./entities/customer-order.entity").CustomerOrder>;
    deliver(id: string): Promise<import("./entities/customer-order.entity").CustomerOrder>;
    reject(id: string, body: {
        reviewedBy?: string;
    }): Promise<import("./entities/customer-order.entity").CustomerOrder>;
    remove(id: string): Promise<void>;
}
