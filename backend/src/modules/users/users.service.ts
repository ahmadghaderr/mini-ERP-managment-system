import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminAddUserToGroupCommand,
  AdminRemoveUserFromGroupCommand,
  AdminDeleteUserCommand,
  AdminUserGlobalSignOutCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.COGNITO_REGION!,
});

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
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async findByCognitoSub(cognitoSub: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { cognitoSub } });
    if (!user) {
      throw new NotFoundException('No local user found for this account');
    }
    return user;
  }

  async findByCognitoSubOrNull(cognitoSub: string): Promise<User | null> {

    return this.userRepo.findOne({ where: { cognitoSub } });
  }

  async create(data: CreateUserDto): Promise<User> {
    let cognitoSub: string;

    try {
      const createResult = await cognitoClient.send(
        new AdminCreateUserCommand({
          UserPoolId: process.env.COGNITO_USER_POOL_ID,
          Username: data.userEmail,
          UserAttributes: [
            { Name: 'email', Value: data.userEmail },
            { Name: 'email_verified', Value: 'true' },
          ],
          DesiredDeliveryMediums: ['EMAIL'],
        }),
      );

      const subAttribute = createResult.User?.Attributes?.find(
        (attr) => attr.Name === 'sub',
      );
      if (!subAttribute?.Value) {
        throw new InternalServerErrorException('Cognito did not return a user sub');
      }
      cognitoSub = subAttribute.Value;

      await cognitoClient.send(
        new AdminAddUserToGroupCommand({
          UserPoolId: process.env.COGNITO_USER_POOL_ID,
          Username: data.userEmail,
          GroupName: data.role,
        }),
      );
    } catch (err) {
      throw new InternalServerErrorException(
        `Failed to create Cognito account: ${(err as Error).message}`,
      );
    }

    const user = this.userRepo.create({
      userName: data.userName,
      userEmail: data.userEmail,
      cognitoSub,
      role: data.role,
    });
    return this.userRepo.save(user);
  }

  async update(id: string, data: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (data.role && data.role !== user.role) {
      await cognitoClient.send(
        new AdminRemoveUserFromGroupCommand({
          UserPoolId: process.env.COGNITO_USER_POOL_ID,
          Username: user.userEmail,
          GroupName: user.role,
        }),
      );

      await cognitoClient.send(
        new AdminAddUserToGroupCommand({
          UserPoolId: process.env.COGNITO_USER_POOL_ID,
          Username: user.userEmail,
          GroupName: data.role,
        }),
      );
    }

    Object.assign(user, data);
    return this.userRepo.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);

    await cognitoClient.send(
      new AdminUserGlobalSignOutCommand({
        UserPoolId: process.env.COGNITO_USER_POOL_ID,
        Username: user.userEmail,
      }),
    );

    await cognitoClient.send(
      new AdminDeleteUserCommand({
        UserPoolId: process.env.COGNITO_USER_POOL_ID,
        Username: user.userEmail,
      }),
    );

    await this.userRepo.remove(user);
  }
}