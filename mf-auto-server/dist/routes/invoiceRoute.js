"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.invoiceRouter = void 0;
const express_1 = __importDefault(require("express"));
const invoiceController_1 = require("../controllers/invoiceController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const roles_1 = require("../constants/roles");
const router = express_1.default.Router();
exports.invoiceRouter = router;
router.get('/', authMiddleware_1.authenticateToken, invoiceController_1.getAllInvoices);
router.get('/:id', authMiddleware_1.authenticateToken, invoiceController_1.getInvoiceById);
router.post('/', authMiddleware_1.authenticateToken, (0, authMiddleware_1.authorize)([roles_1.UserRole.ADMIN, roles_1.UserRole.ACCOUNTANT]), invoiceController_1.createInvoice);
router.put('/:id', authMiddleware_1.authenticateToken, (0, authMiddleware_1.authorize)([roles_1.UserRole.ADMIN, roles_1.UserRole.ACCOUNTANT]), invoiceController_1.updateInvoice);
router.delete('/:id', authMiddleware_1.authenticateToken, (0, authMiddleware_1.authorize)([roles_1.UserRole.ADMIN]), invoiceController_1.deleteInvoice);
router.patch('/:id/pay', authMiddleware_1.authenticateToken, (0, authMiddleware_1.authorize)([roles_1.UserRole.ADMIN, roles_1.UserRole.ACCOUNTANT]), invoiceController_1.markAsPaid);
router.post('/:id/payment', authMiddleware_1.authenticateToken, (0, authMiddleware_1.authorize)([roles_1.UserRole.ADMIN, roles_1.UserRole.ACCOUNTANT]), invoiceController_1.processPayment);
router.get('/:id/pdf', authMiddleware_1.authenticateToken, invoiceController_1.generatePDF);
router.get('/export/excel', authMiddleware_1.authenticateToken, (0, authMiddleware_1.authorize)([roles_1.UserRole.ADMIN, roles_1.UserRole.ACCOUNTANT]), invoiceController_1.exportToExcel);
router.post('/export/pdf', authMiddleware_1.authenticateToken, (0, authMiddleware_1.authorize)([roles_1.UserRole.ADMIN, roles_1.UserRole.ACCOUNTANT]), invoiceController_1.exportFinancialReportPDF);
router.post('/export/excel', authMiddleware_1.authenticateToken, (0, authMiddleware_1.authorize)([roles_1.UserRole.ADMIN, roles_1.UserRole.ACCOUNTANT]), invoiceController_1.exportFinancialReportExcel);
//# sourceMappingURL=invoiceRoute.js.map