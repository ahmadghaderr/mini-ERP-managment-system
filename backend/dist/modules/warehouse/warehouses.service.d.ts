import { Repository } from 'typeorm';
import { Warehouse } from './entities/warehouse.entity';
export declare class WarehousesService {
    private readonly warehouseRepo;
    constructor(warehouseRepo: Repository<Warehouse>);
    findAll(): Promise<Warehouse[]>;
    findOne(id: string): Promise<Warehouse>;
    create(data: Partial<Warehouse>): Promise<Warehouse>;
    update(id: string, data: Partial<Warehouse>): Promise<Warehouse>;
    remove(id: string): Promise<void>;
}
