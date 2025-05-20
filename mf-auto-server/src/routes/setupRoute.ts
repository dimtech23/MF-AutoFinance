// routes/setupRoute.ts
import express, { Request, Response, Router } from 'express';
import bcrypt from 'bcrypt';
import User from '../models/User';
import { UserRole } from '../constants/roles';

const router: Router = express.Router();

router.post('/create-admin', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name } = req.body;

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: UserRole.ADMIN });
    if (existingAdmin) {
      res.status(400).json({ message: 'Admin user already exists' });
      return;
    }

    // Check if email is already in use
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: 'Email already in use' });
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = new User({
      email,
      password: hashedPassword,
      name,
      role: UserRole.ADMIN,
      status: 'active',
      permissions: {
        canManageUsers: true,
        canManageSystem: true,
        canManageClients: true,
        canManageInvoices: true,
        canManageFinances: true,
        canGenerateReports: true,
        canViewClientInfo: true,
        canUpdateRepairStatus: true
      }
    });

    await admin.save();
    res.status(201).json({ message: 'Admin user created successfully' });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export { router };