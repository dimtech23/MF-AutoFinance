"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardRouter = void 0;
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const dashboardController_1 = require("../controllers/dashboardController");
const router = express_1.default.Router();
exports.dashboardRouter = router;
router.get('/stats', authMiddleware_1.authenticateToken, dashboardController_1.getDashboardStats);
router.get('/transactions', authMiddleware_1.authenticateToken, dashboardController_1.getTransactions);
router.get('/appointments', authMiddleware_1.authenticateToken, dashboardController_1.getAppointments);
//# sourceMappingURL=dashboardRoute.js.map