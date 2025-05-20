"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controllers/userController");
const registrationController_1 = require("../controllers/registrationController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const roles_1 = require("../constants/roles");
const router = express_1.default.Router();
exports.router = router;
router.get('/', authMiddleware_1.authenticateToken, (0, authMiddleware_1.authorize)([roles_1.UserRole.ADMIN]), userController_1.getAllUsers);
router.get('/:id', authMiddleware_1.authenticateToken, (0, authMiddleware_1.authorize)([roles_1.UserRole.ADMIN]), userController_1.getUserById);
router.post('/', authMiddleware_1.authenticateToken, (0, authMiddleware_1.authorize)([roles_1.UserRole.ADMIN]), registrationController_1.registerUserByAdmin);
router.put('/:id', authMiddleware_1.authenticateToken, (0, authMiddleware_1.authorize)([roles_1.UserRole.ADMIN]), userController_1.updateUser);
router.delete('/:id', authMiddleware_1.authenticateToken, (0, authMiddleware_1.authorize)([roles_1.UserRole.ADMIN]), userController_1.deleteUser);
router.post('/:id/reset-password', authMiddleware_1.authenticateToken, (0, authMiddleware_1.authorize)([roles_1.UserRole.ADMIN]), userController_1.resetUserPassword);
//# sourceMappingURL=userRoutes.js.map