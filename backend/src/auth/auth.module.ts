import { Module } from '@nestjs/common';
import { CognitoGuard } from './cognito.guard';
import { RolesGuard } from './roles.guard';
import { AuthController } from './auth.controller';
import { UsersModule } from '../modules/users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [CognitoGuard, RolesGuard],
  exports: [CognitoGuard, RolesGuard],
})
export class AuthModule {}
