"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.appointmentRouter = void 0;
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const appointmentController_1 = require("../controllers/appointmentController");
const router = express_1.default.Router();
exports.appointmentRouter = router;
router.post('/', authMiddleware_1.authenticateToken, appointmentController_1.createAppointment);
router.get('/', authMiddleware_1.authenticateToken, appointmentController_1.getAllAppointments);
router.get('/:id', authMiddleware_1.authenticateToken, appointmentController_1.getAppointmentById);
router.put('/:id', authMiddleware_1.authenticateToken, appointmentController_1.updateAppointment);
router.delete('/:id', authMiddleware_1.authenticateToken, appointmentController_1.deleteAppointment);
router.patch('/:id/status', authMiddleware_1.authenticateToken, appointmentController_1.updateAppointmentStatus);
//# sourceMappingURL=appointmentRoute.js.map