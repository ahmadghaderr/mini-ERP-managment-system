import { StockService } from './stock.service';
export declare class StockController {
    private readonly stockService;
    constructor(stockService: StockService);
    findAllMovements(): Promise<import("./entities/stock-movement.entity").StockMovement[]>;
    findAllStock(): Promise<import("./entities/warehouse-prouct.entity").WarehouseProduct[]>;
}
