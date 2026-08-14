import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';    

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  // GET all products
    findAll(): Promise<Product[]> {
    return this.productRepo.find({ order: { createdAt: 'DESC' } });
  }

    // GET one by id
    async findOne(id: string): Promise<Product> {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }
    return product;
  } 

    // CREATE
    create(data: Partial<Product>): Promise<Product> {
    const product = this.productRepo.create(data);
    return this.productRepo.save(product);
  } 

    // UPDATE
    async update(id: string, data: Partial<Product>): Promise<Product> {
    const product = await this.findOne(id); // throws if missing
    Object.assign(product, data);
    return this.productRepo.save(product);
  }

    // DELETE
    async remove(id: string): Promise<void> {
    const product = await this.findOne(id); // throws if missing
    await this.productRepo.remove(product);
  }
}