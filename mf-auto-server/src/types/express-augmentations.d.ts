import { UserDocument } from '../models/User';

declare global {
  namespace Express {
    // Extend the Request interface
    interface Request {
      user?: UserDocument;
    }
  }
}

// This file has no exports, it only augments the global Express namespace
export {}; 