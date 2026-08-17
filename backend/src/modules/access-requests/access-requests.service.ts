import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminAddUserToGroupCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { AccessRequest } from './entities/access-request.entity';
import { AccessRequestStatus } from '../../common/enums';
import { CreateAccessRequestDto } from './dto/create-access-request.dto';
import { ApproveAccessRequestDto } from './dto/approve-access-request.dto';
import { User } from '../users/entities/user.entity';

const sesClient = new SESClient({ region: process.env.COGNITO_REGION! });
const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.COGNITO_REGION!,
});

@Injectable()
export class AccessRequestsService {
  constructor(
    @InjectRepository(AccessRequest)
    private readonly accessRequestRepo: Repository<AccessRequest>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  findAll(): Promise<AccessRequest[]> {
    return this.accessRequestRepo.find({ order: { requestedAt: 'DESC' } });
  }

  async findOne(id: string): Promise<AccessRequest> {
    const request = await this.accessRequestRepo.findOne({ where: { id } });
    if (!request) throw new NotFoundException(`Access request ${id} not found`);
    return request;
  }

  async create(data: CreateAccessRequestDto): Promise<AccessRequest> {
    const request = this.accessRequestRepo.create({ email: data.email });
    const saved = await this.accessRequestRepo.save(request);

    try {
      await sesClient.send(
        new SendEmailCommand({
          Source: process.env.SES_SENDER_EMAIL,
          Destination: { ToAddresses: [process.env.SES_ADMIN_EMAIL!] },
          Message: {
            Subject: { Data: 'New access request - Mini ERP' },
            Body: {
              Text: {
                Data: `${data.email} has requested access to Mini ERP. Review it in the app to approve or reject.`,
              },
            },
          },
        }),
      );
    } catch (err) {
      console.error('Failed to send SES notification:', err);
    }

    return saved;
  }

  async approve(id: string, data: ApproveAccessRequestDto): Promise<User> {
    const request = await this.findOne(id);
    if (request.status !== AccessRequestStatus.PENDING) {
      throw new BadRequestException(
        `Only pending requests can be approved (current: "${request.status}")`,
      );
    }

    let cognitoSub: string;
    try {
      const createResult = await cognitoClient.send(
        new AdminCreateUserCommand({
          UserPoolId: process.env.COGNITO_USER_POOL_ID,
          Username: request.email,
          UserAttributes: [
            { Name: 'email', Value: request.email },
            { Name: 'email_verified', Value: 'true' },
          ],
          DesiredDeliveryMediums: ['EMAIL'],
        }),
      );

      const subAttribute = createResult.User?.Attributes?.find(
        (attr) => attr.Name === 'sub',
      );
      if (!subAttribute?.Value) {
        throw new InternalServerErrorException(
          'Cognito did not return a user sub',
        );
      }
      cognitoSub = subAttribute.Value;

      await cognitoClient.send(
        new AdminAddUserToGroupCommand({
          UserPoolId: process.env.COGNITO_USER_POOL_ID,
          Username: request.email,
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
      userEmail: request.email,
      cognitoSub,
      role: data.role,
    });
    const savedUser = await this.userRepo.save(user);

    request.status = AccessRequestStatus.APPROVED;
    request.reviewedAt = new Date();
    await this.accessRequestRepo.save(request);

    return savedUser;
  }

  async reject(id: string): Promise<AccessRequest> {
    const request = await this.findOne(id);
    request.status = AccessRequestStatus.REJECTED;
    request.reviewedAt = new Date();
    return this.accessRequestRepo.save(request);
  }
}
