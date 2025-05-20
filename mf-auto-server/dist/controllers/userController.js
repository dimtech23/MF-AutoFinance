"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetUserPassword = exports.deleteUser = exports.updateUser = exports.getUserById = exports.getAllUsers = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const User_1 = __importDefault(require("../models/User"));
const roles_1 = require("../constants/roles");
const getAllUsers = async (_req, res) => {
    try {
        const users = await User_1.default.find().select('-password -resetCode -resetCodeExpiry');
        return res.status(200).json(users);
    }
    catch (error) {
        console.error('Error fetching users:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.getAllUsers = getAllUsers;
const getUserById = async (req, res) => {
    try {
        const user = await User_1.default.findById(req.params.id).select('-password -resetCode -resetCodeExpiry');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.status(200).json(user);
    }
    catch (error) {
        console.error('Error fetching user:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.getUserById = getUserById;
const updateUser = async (req, res) => {
    try {
        const { firstName, lastName, email, phone, role, status, permissions } = req.body;
        const user = await User_1.default.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (email && email !== user.email) {
            const existingUser = await User_1.default.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: 'Email already in use' });
            }
            user.email = email;
        }
        if (firstName)
            user.firstName = firstName;
        if (lastName)
            user.lastName = lastName;
        if (phone)
            user.phone = phone;
        if (role)
            user.role = role;
        if (status)
            user.status = status;
        if (permissions) {
            user.permissions = {
                ...user.permissions,
                ...permissions
            };
        }
        if (role === roles_1.UserRole.ADMIN) {
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
        const updatedUser = await User_1.default.findById(req.params.id).select('-password -resetCode -resetCodeExpiry');
        return res.status(200).json(updatedUser);
    }
    catch (error) {
        console.error('Error updating user:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.updateUser = updateUser;
const deleteUser = async (req, res) => {
    try {
        const user = await User_1.default.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        await User_1.default.findByIdAndDelete(req.params.id);
        return res.status(200).json({ message: 'User deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting user:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.deleteUser = deleteUser;
const resetUserPassword = async (req, res) => {
    try {
        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({ message: 'New password must be at least 8 characters long' });
        }
        const user = await User_1.default.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const hashedPassword = await bcrypt_1.default.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();
        return res.status(200).json({ message: 'Password reset successfully' });
    }
    catch (error) {
        console.error('Error resetting password:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.resetUserPassword = resetUserPassword;
//# sourceMappingURL=userController.js.map