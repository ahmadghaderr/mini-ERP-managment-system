import {
  Controller, Get, Post, Body, Patch, Param, Delete, HttpCode,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<User> {
    return this.usersService.findOne(id);
  }

  @Post()
  create(
    @Body() data: { userName: string; userEmail: string; password: string; role?: User['role'] },
  ): Promise<User> {
    return this.usersService.create(data);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() data: { userName?: string; userEmail?: string; password?: string; role?: User['role'] },
  ): Promise<User> {
    return this.usersService.update(id, data);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string): Promise<void> {
    return this.usersService.remove(id);
  }
}