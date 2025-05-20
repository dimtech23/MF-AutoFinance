import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import User from '../models/User';
import { UserRole } from '../constants/roles';

// Get all users
export const getAllUsers = async (_req: Request, res: Response): Promise<Response> => {
  try {
    // Filter out sensitive information
    const users = await User.find().select('-password -resetCode -resetCodeExpiry');
    return res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get a specific user by ID
export const getUserById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const user = await User.findById(req.params.id).select('-password -resetCode -resetCodeExpiry');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Update a user's information
export const updateUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { firstName, lastName, email, phone, role, status, permissions } = req.body;
    
    // Check if user exists
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if email is being changed and if it's already in use
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      user.email = email;
    }
    
    // Update other fields if provided
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (role) user.role = role;
    if (status) user.status = status;
    
    // If permissions are provided, update them
    if (permissions) {
      user.permissions = {
        ...user.permissions,
        ...permissions
      };
    }
    
    // If role is Admin, ensure all permissions are granted
    if (role === UserRole.ADMIN) {
      user.permissions = {
        canManageUsers: true,
        canManageSystem: true,
        canManageClients: true,
        canManageInvoices: true,
        canManageFinances: true,
        canGenerateReports: true,
        canViewClientInfo: true,
        canUpdateRepairStatus: true
      };
    }
    
    await user.save();
    
    // Return updated user without sensitive info
    const updatedUser = await User.findById(req.params.id).select('-password -resetCode -resetCodeExpiry');
    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Delete a user
export const deleteUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    await User.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Reset a user's password (admin function)
export const resetUserPassword = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters long' });
    }
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    
    await user.save();
    return res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};