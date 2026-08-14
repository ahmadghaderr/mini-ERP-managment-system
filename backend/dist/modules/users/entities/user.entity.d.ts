import { UserRole } from '../../../common/enums';
export declare class User {
    id: string;
    userName: string;
    userEmail: string;
    passwordHash: string;
    role: UserRole;
    createdAt: Date;
}
