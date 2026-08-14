import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
export declare class UsersService {
    private readonly userRepo;
    constructor(userRepo: Repository<User>);
    findAll(): Promise<User[]>;
    findOne(id: string): Promise<User>;
    create(data: {
        userName: string;
        userEmail: string;
        password: string;
        role?: User['role'];
    }): Promise<User>;
    update(id: string, data: {
        userName?: string;
        userEmail?: string;
        password?: string;
        role?: User['role'];
    }): Promise<User>;
    remove(id: string): Promise<void>;
}
