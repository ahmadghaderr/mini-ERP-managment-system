import { DataSource, Repository } from 'typeorm';
import { WarehouseTransfer } from './entities/warehouse-transfer.entity';
import { CreateTransferDto } from './dto/create-transfer.dto';
export declare class TransfersService {
    private readonly transferRepo;
    private readonly dataSource;
    constructor(transferRepo: Repository<WarehouseTransfer>, dataSource: DataSource);
    findAll(): Promise<WarehouseTransfer[]>;
    create(data: CreateTransferDto): Promise<WarehouseTransfer>;
}
