import { TransfersService } from './transfers.service';
export declare class TransfersController {
    private readonly transfersService;
    constructor(transfersService: TransfersService);
    findAll(): Promise<import("./entities/warehouse-transfer.entity").WarehouseTransfer[]>;
    create(data: any): Promise<import("./entities/warehouse-transfer.entity").WarehouseTransfer>;
}
