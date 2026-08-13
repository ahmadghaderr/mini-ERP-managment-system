import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
export declare class ProductsService {
    private readonly productRepo;
    constructor(productRepo: Repository<Product>);
    findAll(): Promise<Product[]>;
    findOne(id: string): Promise<Product>;
    create(data: Partial<Product>): Promise<Product>;
    update(id: string, data: Partial<Product>): Promise<Product>;
    remove(id: string): Promise<void>;
}
