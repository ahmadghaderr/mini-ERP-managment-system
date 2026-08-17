import { Repository, DataSource } from 'typeorm';
import { StockMovement } from './entities/stock-movement.entity';
import { WarehouseProduct } from './entities/warehouse-prouct.entity';
import { AdjustStockDto } from './dto/adjust-stock.dto';
export declare class StockService {
    private readonly movementRepo;
    private readonly warehouseProductRepo;
    private readonly dataSource;
    constructor(movementRepo: Repository<StockMovement>, warehouseProductRepo: Repository<WarehouseProduct>, dataSource: DataSource);
    findAllMovements(): Promise<StockMovement[]>;
    findAllStock(): Promise<WarehouseProduct[]>;
    adjustStock(dto: AdjustStockDto): Promise<StockMovement>;
}
