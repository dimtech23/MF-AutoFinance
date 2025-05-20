"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = __importDefault(require("express"));
const loginController_1 = require("../controllers/loginController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = express_1.default.Router();
exports.router = router;
router.get('/status', (req, res) => {
    const origin = req.headers.origin;
    if (origin) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
    }
    res.status(200).json({
        status: 'online',
        message: 'Authentication service is running',
        timestamp: new Date().toISOString()
    });
});
router.post('/login', loginController_1.loginUser);
router.post('/reset', loginController_1.passwordReset);
router.post('/password-reset', loginController_1.resetPassword);
router.post('/verify-reset-code', loginController_1.verifyResetCode);
router.put('/update-info', loginController_1.updateInfo);
router.get('/protected', authMiddleware_1.authenticateToken, (_req, res) => {
    res.json({ message: 'This is a protected route' });
});
//# sourceMappingURL=loginRoute.js.map