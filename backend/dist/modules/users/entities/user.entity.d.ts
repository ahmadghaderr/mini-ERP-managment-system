import { UserRole } from '../../../common/enums';
export declare class User {
    id: string;
    userName: string;
    userEmail: string;
    cognitoSub: string;
    role: UserRole;
    createdAt: Date;
}
