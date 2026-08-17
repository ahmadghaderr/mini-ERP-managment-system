import { UserRole } from '../../../common/enums';
export declare class CreateUserDto {
    userName: string;
    userEmail: string;
    password: string;
    role?: UserRole;
}
