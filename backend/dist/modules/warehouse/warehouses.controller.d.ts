import { WarehousesService } from './warehouses.service';
import { Warehouse } from './entities/warehouse.entity';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
export declare class WarehousesController {
    private readonly warehousesService;
    constructor(warehousesService: WarehousesService);
    findAll(): Promise<Warehouse[]>;
    findOne(id: string): Promise<Warehouse>;
    create(data: CreateWarehouseDto): Promise<Warehouse>;
    update(id: string, data: UpdateWarehouseDto): Promise<Warehouse>;
    remove(id: string): Promise<void>;
}
