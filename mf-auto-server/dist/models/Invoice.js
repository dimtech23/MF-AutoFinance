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
const InvoiceSchema = new mongoose_1.default.Schema({
    invoiceNumber: { type: String, required: true, unique: true },
    status: {
        type: String,
        enum: ['draft', 'pending', 'paid', 'overdue', 'cancelled'],
        default: 'draft'
    },
    issueDate: { type: Date, required: true, default: Date.now },
    dueDate: { type: Date, required: true },
    customerInfo: {
        id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Client' },
        name: { type: String, required: true },
        email: String,
        phone: String,
        address: String
    },
    vehicleInfo: {
        id: String,
        make: String,
        model: String,
        year: String,
        licensePlate: String,
        vin: String,
        odometer: String
    },
    items: [{
            id: Number,
            type: { type: String, enum: ['service', 'part'], required: true },
            description: { type: String, required: true },
            quantity: { type: Number, required: true, default: 1 },
            unitPrice: { type: Number, required: true },
            laborHours: { type: Number, default: 0 },
            laborRate: { type: Number, default: 85 },
            taxable: { type: Boolean, default: true }
        }],
    subtotal: { type: Number, required: true },
    taxRate: { type: Number, default: 7.5 },
    tax: { type: Number, required: true },
    total: { type: Number, required: true },
    notes: String,
    terms: String,
    paymentMethod: String,
    paymentDate: Date,
    paymentReference: String,
    paidAmount: { type: Number, default: 0 },
    partialPayment: { type: Boolean, default: false },
    mechanicNotes: String,
    relatedClientId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Client' },
    relatedRepairId: String,
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }
}, {
    timestamps: true
});
const Invoice = mongoose_1.default.model('Invoice', InvoiceSchema);
exports.default = Invoice;
//# sourceMappingURL=Invoice.js.map