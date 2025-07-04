import { Request, RequestHandler } from 'express';
import { UserDocument } from '../models/User';
import { UserRole } from '../constants/roles';
type PermissionKey = keyof UserDocument['permissions'];
export interface AuthenticatedRequest extends Request {
    user: UserDocument;
}
export declare const authenticateToken: RequestHandler;
export declare const authorize: (roles: UserRole[]) => RequestHandler;
declare const checkPermission: (permission: PermissionKey) => RequestHandler;
export { checkPermission };
