import { StockService } from './stock.service';
import { AdjustStockDto } from './dto/adjust-stock.dto';
export declare class StockController {
    private readonly stockService;
    constructor(stockService: StockService);
    findAllMovements(): Promise<import("./entities/stock-movement.entity").StockMovement[]>;
    findAllStock(): Promise<import("./entities/warehouse-prouct.entity").WarehouseProduct[]>;
    adjustStock(dto: AdjustStockDto): Promise<import("./entities/stock-movement.entity").StockMovement>;
}
