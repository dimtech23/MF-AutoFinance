"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = __importDefault(require("express"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const User_1 = __importDefault(require("../models/User"));
const roles_1 = require("../constants/roles");
const router = express_1.default.Router();
exports.router = router;
router.post('/create-admin', async (req, res) => {
    try {
        const { email, password, name } = req.body;
        const existingAdmin = await User_1.default.findOne({ role: roles_1.UserRole.ADMIN });
        if (existingAdmin) {
            res.status(400).json({ message: 'Admin user already exists' });
            return;
        }
        const existingUser = await User_1.default.findOne({ email });
        if (existingUser) {
            res.status(400).json({ message: 'Email already in use' });
            return;
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const admin = new User_1.default({
            email,
            password: hashedPassword,
            name,
            role: roles_1.UserRole.ADMIN,
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
    }
    catch (error) {
        console.error('Create admin error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
//# sourceMappingURL=setupRoute.js.map