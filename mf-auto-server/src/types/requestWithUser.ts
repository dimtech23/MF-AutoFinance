import { Request } from 'express';
import { UserDocument } from '../models/User';

interface RequestWithUser extends Request {
  user?: UserDocument;
}

export default RequestWithUser;
