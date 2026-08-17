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

  findAll(): Promise<Warehouse[]> {
    return this.warehouseRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Warehouse> {
    const warehouse = await this.warehouseRepo.findOne({ where: { id } });
    if (!warehouse) {
      throw new NotFoundException(`Warehouse ${id} not found`);
    }
    return warehouse;
  }

  create(data: Partial<Warehouse>): Promise<Warehouse> {
    const warehouse = this.warehouseRepo.create(data);
    return this.warehouseRepo.save(warehouse);
  }

  async update(id: string, data: Partial<Warehouse>): Promise<Warehouse> {
    const warehouse = await this.findOne(id);
    Object.assign(warehouse, data);
    return this.warehouseRepo.save(warehouse);
  }

  async remove(id: string): Promise<void> {
    const warehouse = await this.findOne(id);
    await this.warehouseRepo.remove(warehouse);
  }
}
