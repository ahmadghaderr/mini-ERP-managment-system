import { ProductCategory } from '../../../common/enums';
export declare class Product {
    id: string;
    productName: string;
    category: ProductCategory;
    price: number;
    createdAt: Date;
    updatedAt: Date;
}
