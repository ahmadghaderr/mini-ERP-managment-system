import { Controller, Get, Req } from '@nestjs/common';
import { UsersService } from '../modules/users/users.service';
import type { RequestWithUser } from './types';

@Controller('auth')
export class AuthController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  me(@Req() req: RequestWithUser) {
    return this.usersService.findByCognitoSub(req.user.sub);
  }
}
