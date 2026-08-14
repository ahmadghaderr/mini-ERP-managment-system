import { DataSource, Repository } from 'typeorm';
import { WarehouseTransfer } from './entities/warehouse-transfer.entity';
export declare class TransfersService {
    private readonly transferRepo;
    private readonly dataSource;
    constructor(transferRepo: Repository<WarehouseTransfer>, dataSource: DataSource);
    findAll(): Promise<WarehouseTransfer[]>;
    create(data: {
        productId: string;
        fromWarehouseId: string;
        toWarehouseId: string;
        quantity: number;
        createdBy?: string;
    }): Promise<WarehouseTransfer>;
}
