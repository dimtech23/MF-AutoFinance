import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { UserRole } from '../constants/roles';
// import { emailService } from '../services/emailService';

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, phone, password, role = UserRole.MECHANIC } = req.body;
    
    // Check if email already exists
    const existingUser = await User.findOne({ email }).collation({ locale: 'en', strength: 2 });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists!' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Set default permissions based on role
    const permissions = {
      // System management
      canManageUsers: role === UserRole.ADMIN,
      canManageSystem: role === UserRole.ADMIN,
      
      // Core business operations - Accountants can do almost everything
      canManageClients: [UserRole.ADMIN, UserRole.ACCOUNTANT].includes(role),
      canManageInvoices: [UserRole.ADMIN, UserRole.ACCOUNTANT].includes(role),
      canManageFinances: [UserRole.ADMIN, UserRole.ACCOUNTANT].includes(role),
      canGenerateReports: [UserRole.ADMIN, UserRole.ACCOUNTANT].includes(role),
      
      // Limited access for mechanics
      canViewClientInfo: true, // Everyone can view client info
      canUpdateRepairStatus: [UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.MECHANIC].includes(role)
    };

    // Create new user
    const newUser = new User({
      firstName,
      lastName,
      email,
      phone,
      password: hashedPassword,
      role,
      permissions,
      status: 'active'
    });

    await newUser.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser._id, role: newUser.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '24h' }
    );

    // Send welcome email
    // try {
    //   await emailService.sendEmail({
    //     to: email,
    //     subject: 'Welcome to Auto Garage Management',
    //     template: 'welcome',
    //     context: {
    //       name: firstName,
    //       role: role
    //     },
    //   });
    // } catch (emailError) {
    //   console.error('Failed to send welcome email:', emailError);
    //   // Continue execution even if email fails
    // }

    res.status(201).json({ 
      message: 'Account created successfully!', 
      token,
      user: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        email: newUser.email
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Admin can register users
export const registerUserByAdmin = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, phone, role, sendInvitation = true } = req.body;
    
    // Check if email already exists
    const existingUser = await User.findOne({ email }).collation({ locale: 'en', strength: 2 });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists!' });
    }

    // Generate a random password
    const generateRandomPassword = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
      let password = '';
      for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password;
    };
    
    const randomPassword = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    // Set default permissions based on role
    const permissions = {
      // System management
      canManageUsers: role === UserRole.ADMIN,
      canManageSystem: role === UserRole.ADMIN,
      
      // Core business operations - Accountants can do almost everything
      canManageClients: [UserRole.ADMIN, UserRole.ACCOUNTANT].includes(role),
      canManageInvoices: [UserRole.ADMIN, UserRole.ACCOUNTANT].includes(role),
      canManageFinances: [UserRole.ADMIN, UserRole.ACCOUNTANT].includes(role),
      canGenerateReports: [UserRole.ADMIN, UserRole.ACCOUNTANT].includes(role),
      
      // Limited access for mechanics
      canViewClientInfo: true, // Everyone can view client info
      canUpdateRepairStatus: [UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.MECHANIC].includes(role)
    };

    // Create new user
    const newUser = new User({
      firstName,
      lastName,
      email,
      phone,
      password: hashedPassword,
      role,
      permissions,
      status: 'active'
    });

    await newUser.save();

    // Send invitation email if requested
    // if (sendInvitation) {
    //   try {
    //     await emailService.sendEmail({
    //       to: email,
    //       subject: 'Your Account at Auto Garage Management',
    //       template: 'invitation',
    //       context: {
    //         name: firstName,
    //         role: role,
    //         password: randomPassword, // Include temporary password in email
    //         loginUrl: process.env.CLIENT_URL || 'http://localhost:3000/login'
    //       },
    //     });
    //   } catch (emailError) {
    //     console.error('Failed to send invitation email:', emailError);
    //     // Continue execution even if email fails
    //   }
    // }

    res.status(201).json({ 
      message: 'User account created successfully!',
      user: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        email: newUser.email
      },
      invitationSent: sendInvitation
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};