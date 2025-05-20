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
const ClientSchema = new mongoose_1.default.Schema({
    clientName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    email: { type: String },
    carDetails: {
        make: { type: String },
        model: { type: String },
        year: { type: String },
        licensePlate: { type: String },
        color: { type: String },
        vin: { type: String }
    },
    procedures: [{ type: Object }],
    issueDescription: { type: String },
    preExistingIssues: { type: String },
    estimatedDuration: { type: Number, default: 1 },
    deliveryDate: { type: Date },
    paymentStatus: {
        type: String,
        enum: ['paid', 'not_paid', 'partial'],
        default: 'not_paid'
    },
    partialPaymentAmount: { type: Number, default: 0 },
    repairStatus: {
        type: String,
        enum: ['waiting', 'in_progress', 'completed', 'delivered', 'cancelled'],
        default: 'waiting'
    },
    notes: { type: String },
    images: [{
            name: String,
            url: String,
            uploadDate: Date
        }],
    deliveryNotes: { type: String },
    deliveryImages: [{
            name: String,
            url: String,
            uploadDate: Date
        }],
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    documents: [{
            name: String,
            url: String,
            type: String,
            uploadDate: Date
        }]
}, {
    timestamps: true
});
const Client = mongoose_1.default.model('Client', ClientSchema);
exports.default = Client;
//# sourceMappingURL=Client.js.map