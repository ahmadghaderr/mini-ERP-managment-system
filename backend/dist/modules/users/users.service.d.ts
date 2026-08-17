import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersService {
    private readonly userRepo;
    constructor(userRepo: Repository<User>);
    findAll(): Promise<User[]>;
    findOne(id: string): Promise<User>;
    findByCognitoSub(cognitoSub: string): Promise<User>;
    create(data: CreateUserDto): Promise<User>;
    update(id: string, data: UpdateUserDto): Promise<User>;
    remove(id: string): Promise<void>;
}
