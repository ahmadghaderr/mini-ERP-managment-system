import { UserRole } from '../../../common/enums';
export declare class UpdateUserDto {
    userName?: string;
    userEmail?: string;
    password?: string;
    role?: UserRole;
}
