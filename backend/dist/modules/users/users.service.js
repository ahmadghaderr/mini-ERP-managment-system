"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const client_cognito_identity_provider_1 = require("@aws-sdk/client-cognito-identity-provider");
const user_entity_1 = require("./entities/user.entity");
const cognitoClient = new client_cognito_identity_provider_1.CognitoIdentityProviderClient({
    region: process.env.COGNITO_REGION,
});
let UsersService = class UsersService {
    userRepo;
    constructor(userRepo) {
        this.userRepo = userRepo;
    }
    findAll() {
        return this.userRepo.find({ order: { createdAt: 'DESC' } });
    }
    async findOne(id) {
        const user = await this.userRepo.findOne({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException(`User ${id} not found`);
        return user;
    }
    async findByCognitoSub(cognitoSub) {
        const user = await this.userRepo.findOne({ where: { cognitoSub } });
        if (!user) {
            throw new common_1.NotFoundException('No local user found for this account');
        }
        return user;
    }
    async create(data) {
        let cognitoSub;
        try {
            const createResult = await cognitoClient.send(new client_cognito_identity_provider_1.AdminCreateUserCommand({
                UserPoolId: process.env.COGNITO_USER_POOL_ID,
                Username: data.userEmail,
                UserAttributes: [
                    { Name: 'email', Value: data.userEmail },
                    { Name: 'email_verified', Value: 'true' },
                ],
                DesiredDeliveryMediums: ['EMAIL'],
            }));
            const subAttribute = createResult.User?.Attributes?.find((attr) => attr.Name === 'sub');
            if (!subAttribute?.Value) {
                throw new common_1.InternalServerErrorException('Cognito did not return a user sub');
            }
            cognitoSub = subAttribute.Value;
            await cognitoClient.send(new client_cognito_identity_provider_1.AdminAddUserToGroupCommand({
                UserPoolId: process.env.COGNITO_USER_POOL_ID,
                Username: data.userEmail,
                GroupName: data.role,
            }));
        }
        catch (err) {
            throw new common_1.InternalServerErrorException(`Failed to create Cognito account: ${err.message}`);
        }
        const user = this.userRepo.create({
            userName: data.userName,
            userEmail: data.userEmail,
            cognitoSub,
            role: data.role,
        });
        return this.userRepo.save(user);
    }
    async update(id, data) {
        const user = await this.findOne(id);
        if (data.role && data.role !== user.role) {
            await cognitoClient.send(new client_cognito_identity_provider_1.AdminAddUserToGroupCommand({
                UserPoolId: process.env.COGNITO_USER_POOL_ID,
                Username: user.userEmail,
                GroupName: data.role,
            }));
        }
        Object.assign(user, data);
        return this.userRepo.save(user);
    }
    async remove(id) {
        const user = await this.findOne(id);
        await cognitoClient.send(new client_cognito_identity_provider_1.AdminDeleteUserCommand({
            UserPoolId: process.env.COGNITO_USER_POOL_ID,
            Username: user.userEmail,
        }));
        await this.userRepo.remove(user);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map