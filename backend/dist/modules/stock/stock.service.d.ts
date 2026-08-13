import { Repository } from 'typeorm';
import { StockMovement } from './entities/stock-movement.entity';
import { WarehouseProduct } from './entities/warehouse-prouct.entity';
export declare class StockService {
    private readonly movementRepo;
    private readonly warehouseProductRepo;
    constructor(movementRepo: Repository<StockMovement>, warehouseProductRepo: Repository<WarehouseProduct>);
    findAllMovements(): Promise<StockMovement[]>;
    findAllStock(): Promise<WarehouseProduct[]>;
}
