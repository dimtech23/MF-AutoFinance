import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import User, { UserDocument } from '../models/User';
import { UserRole } from '../constants/roles';

type PermissionKey = keyof UserDocument['permissions'];

// Define a custom request type that includes the user property
interface AuthenticatedRequest extends Request {
  user: UserDocument;
}

// Function to authenticate token and verify user exists
export const authenticateToken: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ message: 'Access denied. No token provided.' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: string };
    const user = await User.findById(decoded.userId);

    if (!user) {
      res.status(401).json({ message: 'Invalid token. User not found.' });
      return;
    }

    if (user.status !== 'active') {
      res.status(403).json({ error: 'Account is inactive or pending approval' });
      return;
    }

    (req as AuthenticatedRequest).user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

// Authorize roles
export const authorize = (roles: UserRole[]): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) {
        res.status(401).json({ message: 'Access denied. No user found.' });
        return;
      }

      if (!roles.includes(authReq.user.role)) {
        res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  };
};

// Check specific permission
const checkPermission = (permission: PermissionKey): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header is missing' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token is missing' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as JwtPayload;
      const user = await User.findById(decoded.userId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const authReq = req as AuthenticatedRequest;
      authReq.user = user;

      if (user.role === UserRole.ADMIN || user.permissions[permission]) {
        return next();
      }

      return res.status(403).json({ error: 'Insufficient permissions for this operation' });
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ error: 'Token is invalid or expired' });
      } else {
        return res.status(500).json({ error: 'Internal Server Error', details: error });
      }
    }
  };
};

export { checkPermission };
