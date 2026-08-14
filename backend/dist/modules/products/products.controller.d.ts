import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    findAll(): Promise<Product[]>;
    findOne(id: string): Promise<Product>;
    create(data: CreateProductDto): Promise<Product>;
    update(id: string, data: UpdateProductDto): Promise<Product>;
    remove(id: string): Promise<void>;
}
