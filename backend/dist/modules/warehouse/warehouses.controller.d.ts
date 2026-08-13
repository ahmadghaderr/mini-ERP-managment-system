import { WarehousesService } from './warehouses.service';
import { Warehouse } from './entities/warehouse.entity';
export declare class WarehousesController {
    private readonly warehousesService;
    constructor(warehousesService: WarehousesService);
    findAll(): Promise<Warehouse[]>;
    findOne(id: string): Promise<Warehouse>;
    create(data: Partial<Warehouse>): Promise<Warehouse>;
    update(id: string, data: Partial<Warehouse>): Promise<Warehouse>;
    remove(id: string): Promise<void>;
}
