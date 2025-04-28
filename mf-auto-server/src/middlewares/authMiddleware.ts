import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import User, { UserDocument } from '../models/User';
import { UserRole } from '../constants/roles';
import RequestWithUser from '../types/requestWithUser';

// Function to authenticate token and verify user exists
const authenticateToken: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
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

    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Account is inactive or pending approval' });
    }

    (req as RequestWithUser).user = user; // Type assertion
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Token is invalid or expired' });
    } else {
      return res.status(500).json({ error: 'Internal Server Error', details: error });
    }
  }
};

// Authorize roles
const authorize = (requiredRoles: UserRole[]): RequestHandler => {
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

      if (user.status !== 'active') {
        return res.status(403).json({ error: 'Account is inactive or pending approval' });
      }

      (req as RequestWithUser).user = user;

      if (!requiredRoles.includes(user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions for this operation' });
      }

      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ error: 'Token is invalid or expired' });
      } else {
        return res.status(500).json({ error: 'Internal Server Error', details: error });
      }
    }
  };
};

// Check specific permission
const checkPermission = (permission: keyof UserDocument['permissions']): RequestHandler => {
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

      (req as RequestWithUser).user = user;

      if (user.role === UserRole.ADMIN || user.permissions?.[permission]) {
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

export { authenticateToken, authorize, checkPermission };
