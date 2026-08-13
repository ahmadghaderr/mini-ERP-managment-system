import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Warehouse } from './entities/warehouse.entity';

@Injectable()
export class WarehousesService {
  constructor(
    @InjectRepository(Warehouse)
    private readonly warehouseRepo: Repository<Warehouse>,
  ) {}

  // GET all warehouses
  findAll(): Promise<Warehouse[]> {
    return this.warehouseRepo.find({ order: { createdAt: 'DESC' } });
  }

  // GET one by id
  async findOne(id: string): Promise<Warehouse> {
    const warehouse = await this.warehouseRepo.findOne({ where: { id } });
    if (!warehouse) {
      throw new NotFoundException(`Warehouse ${id} not found`);
    }
    return warehouse;
  }

  // CREATE
  create(data: Partial<Warehouse>): Promise<Warehouse> {
    const warehouse = this.warehouseRepo.create(data);
    return this.warehouseRepo.save(warehouse);
  }

  // UPDATE
  async update(id: string, data: Partial<Warehouse>): Promise<Warehouse> {
    const warehouse = await this.findOne(id); // throws if missing
    Object.assign(warehouse, data);
    return this.warehouseRepo.save(warehouse);
  }

  // DELETE
  async remove(id: string): Promise<void> {
    const warehouse = await this.findOne(id); // throws if missing
    await this.warehouseRepo.remove(warehouse);
  }
}