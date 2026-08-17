import { TransfersService } from './transfers.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
export declare class TransfersController {
    private readonly transfersService;
    constructor(transfersService: TransfersService);
    findAll(): Promise<import("./entities/warehouse-transfer.entity").WarehouseTransfer[]>;
    create(data: CreateTransferDto): Promise<import("./entities/warehouse-transfer.entity").WarehouseTransfer>;
}
