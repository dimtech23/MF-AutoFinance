"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.expenseRouter = void 0;
const express_1 = __importDefault(require("express"));
const expenseController_1 = require("../controllers/expenseController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const roles_1 = require("../constants/roles");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const router = express_1.default.Router();
exports.expenseRouter = router;
const uploadsDir = 'uploads/receipts';
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
    console.log(`Created uploads directory: ${uploadsDir}`);
}
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'receipt-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
            cb(null, true);
        }
        else {
            cb(new Error('Only image and PDF files are allowed'));
        }
    }
});
router.get('/', authMiddleware_1.authenticateToken, expenseController_1.getAllExpenses);
router.get('/stats', authMiddleware_1.authenticateToken, expenseController_1.getExpenseStats);
router.get('/:id', authMiddleware_1.authenticateToken, expenseController_1.getExpenseById);
router.post('/', authMiddleware_1.authenticateToken, (0, authMiddleware_1.authorize)([roles_1.UserRole.ADMIN, roles_1.UserRole.ACCOUNTANT]), expenseController_1.createExpense);
router.put('/:id', authMiddleware_1.authenticateToken, (0, authMiddleware_1.authorize)([roles_1.UserRole.ADMIN, roles_1.UserRole.ACCOUNTANT]), expenseController_1.updateExpense);
router.delete('/:id', authMiddleware_1.authenticateToken, (0, authMiddleware_1.authorize)([roles_1.UserRole.ADMIN, roles_1.UserRole.ACCOUNTANT]), expenseController_1.deleteExpense);
router.patch('/:id/status', authMiddleware_1.authenticateToken, (0, authMiddleware_1.authorize)([roles_1.UserRole.ADMIN, roles_1.UserRole.ACCOUNTANT]), expenseController_1.updateExpenseStatus);
router.post('/:id/receipt', authMiddleware_1.authenticateToken, (0, authMiddleware_1.authorize)([roles_1.UserRole.ADMIN, roles_1.UserRole.ACCOUNTANT]), upload.single('receipt'), expenseController_1.uploadReceipt);
//# sourceMappingURL=expenseRoute.js.map