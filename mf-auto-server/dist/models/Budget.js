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
const BudgetSchema = new mongoose_1.default.Schema({
    name: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    total: { type: Number, required: true },
    categories: [{
            id: { type: Number, required: true },
            name: { type: String, required: true },
            allocated: { type: Number, required: true },
            spent: { type: Number, default: 0 }
        }],
    notes: { type: String },
    status: {
        type: String,
        enum: ['active', 'upcoming', 'completed'],
        default: 'upcoming'
    },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: false }
}, {
    timestamps: true
});
BudgetSchema.pre('save', function (next) {
    const now = new Date();
    if (now < this.startDate) {
        this.status = 'upcoming';
    }
    else if (now > this.endDate) {
        this.status = 'completed';
    }
    else {
        this.status = 'active';
    }
    next();
});
const Budget = mongoose_1.default.model('Budget', BudgetSchema);
exports.default = Budget;
//# sourceMappingURL=Budget.js.map