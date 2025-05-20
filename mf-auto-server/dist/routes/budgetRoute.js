"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.budgetRouter = void 0;
const express_1 = __importDefault(require("express"));
const budgetController_1 = require("../controllers/budgetController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const roles_1 = require("../constants/roles");
const router = express_1.default.Router();
exports.budgetRouter = router;
router.get('/', authMiddleware_1.authenticateToken, budgetController_1.getAllBudgets);
router.get('/:id', authMiddleware_1.authenticateToken, budgetController_1.getBudgetById);
router.post('/', authMiddleware_1.authenticateToken, (0, authMiddleware_1.authorize)([roles_1.UserRole.ADMIN, roles_1.UserRole.ACCOUNTANT]), budgetController_1.createBudget);
router.put('/:id', authMiddleware_1.authenticateToken, (0, authMiddleware_1.authorize)([roles_1.UserRole.ADMIN, roles_1.UserRole.ACCOUNTANT]), budgetController_1.updateBudget);
router.delete('/:id', authMiddleware_1.authenticateToken, (0, authMiddleware_1.authorize)([roles_1.UserRole.ADMIN]), budgetController_1.deleteBudget);
//# sourceMappingURL=budgetRoute.js.map