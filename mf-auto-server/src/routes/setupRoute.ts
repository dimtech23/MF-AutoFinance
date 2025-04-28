// routes/setupRoute.ts
import express from 'express';
import bcrypt from 'bcrypt';
import User from '../models/User';
import { UserRole } from '../constants/roles';

export const router = express.Router();


router.post('/create-admin', async (req, res) => {
  try {
    // Check if admin user already exists
    const adminExists = await User.findOne({ role: UserRole.ADMIN });
    if (adminExists) {
      return res.status(400).json({ message: 'Admin user already exists' });
    }
    
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const adminUser = new User({
      firstName: 'Admin',
      lastName: 'User',
      email,
      password: hashedPassword,
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
    
    await adminUser.save();
    
    res.status(201).json({ message: 'Admin user created successfully!' });
  } catch (error) {
    console.error('Error creating admin user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export { router as setupRouter };