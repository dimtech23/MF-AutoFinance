"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const roles_1 = require("../constants/roles");
const UserSchema = new mongoose_1.default.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    role: {
        type: String,
        enum: Object.values(roles_1.UserRole),
        default: roles_1.UserRole.MECHANIC
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'pending'],
        default: 'active'
    },
    permissions: {
        canManageUsers: { type: Boolean, default: false },
        canManageSystem: { type: Boolean, default: false },
        canManageClients: { type: Boolean, default: false },
        canManageInvoices: { type: Boolean, default: false },
        canManageFinances: { type: Boolean, default: false },
        canGenerateReports: { type: Boolean, default: false },
        canViewClientInfo: { type: Boolean, default: true },
        canUpdateRepairStatus: { type: Boolean, default: false }
    },
    lastLogin: { type: Date, default: null },
    resetCode: { type: String, default: null },
    resetCodeExpiry: { type: Date, default: null }
}, {
    timestamps: true
});
const User = mongoose_1.default.model('User', UserSchema);
exports.default = User;
//# sourceMappingURL=User.js.map