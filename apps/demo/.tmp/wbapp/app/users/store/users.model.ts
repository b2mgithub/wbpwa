import { AuthUser } from '@b2m/auth';

export class User extends AuthUser {
    Division: string;
    EmailReport: boolean;
}