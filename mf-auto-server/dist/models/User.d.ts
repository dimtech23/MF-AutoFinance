import mongoose, { Document } from 'mongoose';
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
        canManageUsers: boolean;
        canManageSystem: boolean;
        canManageClients: boolean;
        canManageInvoices: boolean;
        canManageFinances: boolean;
        canGenerateReports: boolean;
        canViewClientInfo: boolean;
        canUpdateRepairStatus: boolean;
    };
    lastLogin?: Date | null;
    resetCode?: string | null;
    resetCodeExpiry?: Date | null;
}
declare const User: mongoose.Model<UserDocument, {}, {}, {}, mongoose.Document<unknown, {}, UserDocument, {}> & UserDocument & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default User;
