import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  // GET all users
  findAll(): Promise<User[]> {
    return this.userRepo.find({ order: { createdAt: 'DESC' } });
  }

  // GET one by id
  async findOne(id: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  }

  // CREATE — hashes the password before saving
  async create(data: {
    userName: string;
    userEmail: string;
    password: string;
    role?: User['role'];
  }): Promise<User> {
    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = this.userRepo.create({
      userName: data.userName,
      userEmail: data.userEmail,
      passwordHash,        // store the hash, never the raw password
      role: data.role,
    });
    return this.userRepo.save(user);
  }

  // UPDATE — re-hashes only if a new password is provided
  async update(
    id: string,
    data: { userName?: string; userEmail?: string; password?: string; role?: User['role'] },
  ): Promise<User> {
    const user = await this.findOne(id); // throws if missing

    if (data.userName !== undefined) user.userName = data.userName;
    if (data.userEmail !== undefined) user.userEmail = data.userEmail;
    if (data.role !== undefined) user.role = data.role;
    if (data.password) {
      user.passwordHash = await bcrypt.hash(data.password, 10);
    }

    return this.userRepo.save(user);
  }

  // DELETE
  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepo.remove(user);
  }
}