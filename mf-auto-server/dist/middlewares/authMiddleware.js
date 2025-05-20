"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPermission = exports.authorize = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const roles_1 = require("../constants/roles");
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            res.status(401).json({ message: 'Access denied. No token provided.' });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = await User_1.default.findById(decoded.userId);
        if (!user) {
            res.status(401).json({ message: 'Invalid token. User not found.' });
            return;
        }
        if (user.status !== 'active') {
            res.status(403).json({ error: 'Account is inactive or pending approval' });
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        res.status(401).json({ message: 'Invalid token.' });
    }
};
exports.authenticateToken = authenticateToken;
const authorize = (roles) => {
    return async (req, res, next) => {
        try {
            const authReq = req;
            if (!authReq.user) {
                res.status(401).json({ message: 'Access denied. No user found.' });
                return;
            }
            if (!roles.includes(authReq.user.role)) {
                res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
                return;
            }
            next();
        }
        catch (error) {
            res.status(500).json({ message: 'Internal server error' });
        }
    };
};
exports.authorize = authorize;
const checkPermission = (permission) => {
    return async (req, res, next) => {
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            return res.status(401).json({ error: 'Authorization header is missing' });
        }
        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Token is missing' });
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'default_secret');
            const user = await User_1.default.findById(decoded.userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            const authReq = req;
            authReq.user = user;
            if (user.role === roles_1.UserRole.ADMIN || user.permissions[permission]) {
                return next();
            }
            return res.status(403).json({ error: 'Insufficient permissions for this operation' });
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                return res.status(401).json({ error: 'Token is invalid or expired' });
            }
            else {
                return res.status(500).json({ error: 'Internal Server Error', details: error });
            }
        }
    };
};
exports.checkPermission = checkPermission;
//# sourceMappingURL=authMiddleware.js.map