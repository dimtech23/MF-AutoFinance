"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUserByAdmin = exports.registerUser = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const roles_1 = require("../constants/roles");
const registerUser = async (req, res) => {
    try {
        const { firstName, lastName, email, phone, password, role = roles_1.UserRole.MECHANIC } = req.body;
        const existingUser = await User_1.default.findOne({ email }).collation({ locale: 'en', strength: 2 });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists!' });
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const permissions = {
            canManageUsers: role === roles_1.UserRole.ADMIN,
            canManageSystem: role === roles_1.UserRole.ADMIN,
            canManageClients: [roles_1.UserRole.ADMIN, roles_1.UserRole.ACCOUNTANT].includes(role),
            canManageInvoices: [roles_1.UserRole.ADMIN, roles_1.UserRole.ACCOUNTANT].includes(role),
            canManageFinances: [roles_1.UserRole.ADMIN, roles_1.UserRole.ACCOUNTANT].includes(role),
            canGenerateReports: [roles_1.UserRole.ADMIN, roles_1.UserRole.ACCOUNTANT].includes(role),
            canViewClientInfo: true,
            canUpdateRepairStatus: [roles_1.UserRole.ADMIN, roles_1.UserRole.ACCOUNTANT, roles_1.UserRole.MECHANIC].includes(role)
        };
        const newUser = new User_1.default({
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
        const token = jsonwebtoken_1.default.sign({ userId: newUser._id, role: newUser.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
        return res.status(201).json({
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
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};
exports.registerUser = registerUser;
const registerUserByAdmin = async (req, res) => {
    try {
        const { firstName, lastName, email, phone, role, sendInvitation = true } = req.body;
        const existingUser = await User_1.default.findOne({ email }).collation({ locale: 'en', strength: 2 });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists!' });
        }
        const generateRandomPassword = () => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
            let password = '';
            for (let i = 0; i < 12; i++) {
                password += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return password;
        };
        const randomPassword = generateRandomPassword();
        const hashedPassword = await bcrypt_1.default.hash(randomPassword, 10);
        const permissions = {
            canManageUsers: role === roles_1.UserRole.ADMIN,
            canManageSystem: role === roles_1.UserRole.ADMIN,
            canManageClients: [roles_1.UserRole.ADMIN, roles_1.UserRole.ACCOUNTANT].includes(role),
            canManageInvoices: [roles_1.UserRole.ADMIN, roles_1.UserRole.ACCOUNTANT].includes(role),
            canManageFinances: [roles_1.UserRole.ADMIN, roles_1.UserRole.ACCOUNTANT].includes(role),
            canGenerateReports: [roles_1.UserRole.ADMIN, roles_1.UserRole.ACCOUNTANT].includes(role),
            canViewClientInfo: true,
            canUpdateRepairStatus: [roles_1.UserRole.ADMIN, roles_1.UserRole.ACCOUNTANT, roles_1.UserRole.MECHANIC].includes(role)
        };
        const newUser = new User_1.default({
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
        return res.status(201).json({
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
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};
exports.registerUserByAdmin = registerUserByAdmin;
//# sourceMappingURL=registrationController.js.map