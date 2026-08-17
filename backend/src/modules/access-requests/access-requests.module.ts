import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessRequest } from './entities/access-request.entity';
import { User } from '../users/entities/user.entity';
import { AccessRequestsService } from './access-requests.service';
import { AccessRequestsController } from './access-requests.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AccessRequest, User])],
  providers: [AccessRequestsService],
  controllers: [AccessRequestsController],
})
export class AccessRequestsModule {}
