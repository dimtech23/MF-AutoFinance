import * as express from 'express';
import { UserDocument } from './models/User'; // adjust the path if needed

declare global {
  namespace Express {
    interface Request {
      user?: UserDocument;
    }
  }
}
