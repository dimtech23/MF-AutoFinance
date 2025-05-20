"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.updateInfo = exports.verifyResetCode = exports.passwordReset = exports.loginUser = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(`Login attempt for: ${email}`);
        const user = await User_1.default.findOne({ email }).collation({ locale: 'en', strength: 2 });
        if (!user) {
            console.log(`Login failed: No user found with email ${email}`);
            res.status(404).json({ message: 'No account associated with this email. Please check the email entered or register.' });
            return;
        }
        const passwordMatch = await bcrypt_1.default.compare(password, user.password);
        if (!passwordMatch) {
            console.log(`Login failed: Incorrect password for ${email}`);
            res.status(401).json({ message: 'Incorrect password. Please try again' });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });
        console.log(`Login successful for ${email}`);
        const origin = req.headers.origin;
        if (origin) {
            res.header('Access-Control-Allow-Origin', origin);
            res.header('Access-Control-Allow-Credentials', 'true');
        }
        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                role: user.role,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName
            }
        });
    }
    catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.loginUser = loginUser;
const generateCode = (length) => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const charLen = characters.length;
    let code = "";
    for (let i = 0; i < length; i++) {
        code += characters.charAt(Math.floor(Math.random() * charLen));
    }
    return code;
};
const passwordReset = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User_1.default.findOne({ email });
        if (!user) {
            res.status(404).json({ message: 'No account associated with this email. Please check the email entered or register.' });
            return;
        }
        const resetCode = generateCode(6);
        const resetCodeExpiry = new Date();
        resetCodeExpiry.setMinutes(resetCodeExpiry.getMinutes() + 10);
        user.resetCode = resetCode;
        user.resetCodeExpiry = resetCodeExpiry;
        await user.save();
        res.status(200).json({ message: 'Password Reset Request Sent!' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.passwordReset = passwordReset;
const verifyResetCode = async (req, res) => {
    try {
        const { email, resetCode } = req.body;
        const user = await User_1.default.findOne({ email });
        if (!user) {
            res.status(404).json({ message: 'No account associated with this email.' });
            return;
        }
        if (!user.resetCode || !user.resetCodeExpiry || user.resetCode !== resetCode) {
            res.status(400).json({ message: 'Invalid or expired reset code.' });
            return;
        }
        if (user.resetCodeExpiry < new Date()) {
            res.status(400).json({ message: 'The reset code has expired.' });
            return;
        }
        res.status(200).json({ message: 'Reset code verified. Proceed to reset password.' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.verifyResetCode = verifyResetCode;
const updateInfo = async (req, res) => {
    try {
        const { userId, newEmail, newPassword } = req.body;
        const user = await User_1.default.findOne({ _id: userId });
        if (!user) {
            res.status(400).json({ message: "User not found!" });
            return;
        }
        if (newEmail) {
            const existingUser = await User_1.default.findOne({ email: newEmail }).exec();
            if (existingUser && existingUser._id && existingUser._id.toString() !== userId) {
                res.status(409).json({ message: 'This email is already in use.' });
                return;
            }
            user.email = newEmail;
        }
        if (newPassword) {
            user.password = await bcrypt_1.default.hash(newPassword, 10);
        }
        await user.save();
        res.status(200).json({ message: 'User updated successfully.' });
    }
    catch (error) {
        console.error('Error in updateInfo:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.updateInfo = updateInfo;
const resetPassword = async (req, res) => {
    try {
        const { email, resetCode, newPassword } = req.body;
        const user = await User_1.default.findOne({ email });
        if (!user || user.resetCode !== resetCode || (user.resetCodeExpiry && user.resetCodeExpiry < new Date())) {
            res.status(400).json({ message: 'Invalid or expired reset code.' });
            return;
        }
        user.password = await bcrypt_1.default.hash(newPassword, 10);
        user.resetCode = undefined;
        user.resetCodeExpiry = undefined;
        await user.save();
        res.status(200).json({ message: 'Password successfully reset.' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.resetPassword = resetPassword;
//# sourceMappingURL=loginController.js.map