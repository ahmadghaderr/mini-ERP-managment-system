import { Request } from 'express';

export interface CognitoUser {
  sub: string;
  email: string;
  groups: string[];
}

export type RequestWithUser = Request & { user: CognitoUser };
