import mongoose, { Schema, Document } from 'mongoose';
import { UserRole } from '../constants/roles';

export interface UserDocument extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  role: UserRole;
  status: 'active' | 'inactive' | 'pending';
  permissions: {
    // System management
    canManageUsers: boolean;
    canManageSystem: boolean;
    
    // Core business operations
    canManageClients: boolean;
    canManageInvoices: boolean;
    canManageFinances: boolean;
    canGenerateReports: boolean;
    
    // Limited access
    canViewClientInfo: boolean;
    canUpdateRepairStatus: boolean;
  };
  lastLogin?: Date | null;
  resetCode?: string | null;
  resetCodeExpiry?: Date | null;
}

const UserSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  role: { 
    type: String, 
    enum: Object.values(UserRole), 
    default: UserRole.MECHANIC 
  },
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'pending'], 
    default: 'active' 
  },
  permissions: {
    // System management
    canManageUsers: { type: Boolean, default: false },
    canManageSystem: { type: Boolean, default: false },
    
    // Core business operations
    canManageClients: { type: Boolean, default: false },
    canManageInvoices: { type: Boolean, default: false },
    canManageFinances: { type: Boolean, default: false },
    canGenerateReports: { type: Boolean, default: false },
    
    // Limited access
    canViewClientInfo: { type: Boolean, default: true }, // Even mechanics can view
    canUpdateRepairStatus: { type: Boolean, default: false }
  },
  lastLogin: { type: Date, default: null },
  resetCode: { type: String, default: null },
  resetCodeExpiry: { type: Date, default: null }
}, {
  timestamps: true
});

const User = mongoose.model<UserDocument>('User', UserSchema);
export default User;