import type { Request } from 'express-serve-static-core';
import { UserDocument } from '../models/User';
export interface RequestWithUser extends Request {
    user?: UserDocument;
}
export default RequestWithUser;
