import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  findAll(): Promise<User[]> {
    return this.userRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  }

  async create(data: CreateUserDto): Promise<User> {
    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = this.userRepo.create({
      userName: data.userName,
      userEmail: data.userEmail,
      passwordHash,
      role: data.role,
    });
    return this.userRepo.save(user);
  }

  async update(id: string, data: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (data.userName !== undefined) user.userName = data.userName;
    if (data.userEmail !== undefined) user.userEmail = data.userEmail;
    if (data.role !== undefined) user.role = data.role;
    if (data.password) {
      user.passwordHash = await bcrypt.hash(data.password, 10);
    }

    return this.userRepo.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepo.remove(user);
  }
}
