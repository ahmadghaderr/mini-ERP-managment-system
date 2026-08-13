import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    findAll(): Promise<Product[]>;
    findOne(id: string): Promise<Product>;
    create(data: Partial<Product>): Promise<Product>;
    update(id: string, data: Partial<Product>): Promise<Product>;
    remove(id: string): Promise<void>;
}
