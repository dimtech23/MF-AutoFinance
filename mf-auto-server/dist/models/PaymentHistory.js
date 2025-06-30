"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const PaymentHistorySchema = new mongoose_1.default.Schema({
    clientId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Client', required: true },
    invoiceId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Invoice' },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, required: true, default: 'cash' },
    paymentDate: { type: Date, required: true, default: Date.now },
    paymentReference: { type: String },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'completed'
    },
    recordedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    description: { type: String, required: true },
    notes: { type: String }
}, {
    timestamps: true
});
PaymentHistorySchema.index({ clientId: 1, paymentDate: -1 });
PaymentHistorySchema.index({ paymentDate: -1 });
PaymentHistorySchema.index({ status: 1 });
const PaymentHistory = mongoose_1.default.model('PaymentHistory', PaymentHistorySchema);
exports.default = PaymentHistory;
//# sourceMappingURL=PaymentHistory.js.map