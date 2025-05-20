"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = __importDefault(require("express"));
const registrationController_1 = require("../controllers/registrationController");
const clientController_1 = require("../controllers/clientController");
const router = express_1.default.Router();
exports.router = router;
router.post('/register', registrationController_1.registerUser);
router.post('/admin', clientController_1.registerAdmin);
//# sourceMappingURL=registrationRoute.js.map