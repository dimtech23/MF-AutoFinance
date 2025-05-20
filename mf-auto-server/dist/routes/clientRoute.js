"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientRouter = void 0;
const express_1 = __importDefault(require("express"));
const clientController_1 = require("../controllers/clientController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const roles_1 = require("../constants/roles");
const router = express_1.default.Router();
exports.clientRouter = router;
router.use(authMiddleware_1.authenticateToken);
router.get('/', clientController_1.getAllClients);
router.get('/summary', clientController_1.getClientSummary);
router.get('/history', clientController_1.getAllClientHistory);
router.get('/:id', clientController_1.getClientById);
router.post('/', (0, authMiddleware_1.authorize)([roles_1.UserRole.ADMIN, roles_1.UserRole.ACCOUNTANT]), clientController_1.createClient);
router.put('/:id', (0, authMiddleware_1.authorize)([roles_1.UserRole.ADMIN, roles_1.UserRole.ACCOUNTANT]), clientController_1.updateClient);
router.delete('/:id', (0, authMiddleware_1.authorize)([roles_1.UserRole.ADMIN]), clientController_1.deleteClient);
router.get('/:id/history', clientController_1.getClientHistory);
router.patch('/:id/status', clientController_1.updateClientStatus);
router.patch('/:id/payment', (0, authMiddleware_1.authorize)([roles_1.UserRole.ADMIN, roles_1.UserRole.ACCOUNTANT]), clientController_1.updatePaymentStatus);
router.patch('/:id/delivery', (0, authMiddleware_1.authorize)([roles_1.UserRole.ADMIN, roles_1.UserRole.ACCOUNTANT]), clientController_1.markAsDelivered);
router.post('/register-admin', clientController_1.registerAdmin);
//# sourceMappingURL=clientRoute.js.map