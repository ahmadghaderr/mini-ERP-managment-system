import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common';
import { AccessRequestsService } from './access-requests.service';
import { CreateAccessRequestDto } from './dto/create-access-request.dto';
import { ApproveAccessRequestDto } from './dto/approve-access-request.dto';
import { Public, Roles } from '../../auth/roles.decorator';

@Controller('access-requests')
export class AccessRequestsController {
  constructor(private readonly service: AccessRequestsService) {}

  @Public()
  @Post()
  create(@Body() data: CreateAccessRequestDto) {
    return this.service.create(data);
  }

  @Roles('admin')
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Roles('admin')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles('admin')
  @Patch(':id/approve')
  approve(@Param('id') id: string, @Body() data: ApproveAccessRequestDto) {
    return this.service.approve(id, data);
  }

  @Roles('admin')
  @Patch(':id/reject')
  reject(@Param('id') id: string) {
    return this.service.reject(id);
  }
}
