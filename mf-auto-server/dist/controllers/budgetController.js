"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBudget = exports.updateBudget = exports.createBudget = exports.getBudgetById = exports.getAllBudgets = void 0;
const Budget_1 = __importDefault(require("../models/Budget"));
const roles_1 = require("../constants/roles");
const mongoose_1 = __importDefault(require("mongoose"));
const getAllBudgets = async (_req, res) => {
    try {
        const budgets = await Budget_1.default.find().sort({ createdAt: -1 });
        return res.status(200).json(budgets);
    }
    catch (error) {
        console.error('Error fetching budgets:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.getAllBudgets = getAllBudgets;
const getBudgetById = async (req, res) => {
    try {
        const budget = await Budget_1.default.findById(req.params.id);
        if (!budget) {
            return res.status(404).json({ message: 'Budget not found' });
        }
        return res.status(200).json(budget);
    }
    catch (error) {
        console.error('Error fetching budget:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.getBudgetById = getBudgetById;
const createBudget = async (req, res) => {
    try {
        const { name, startDate, endDate, total, categories, notes } = req.body;
        const totalAllocated = categories.reduce((sum, category) => sum + category.allocated, 0);
        if (Math.abs(totalAllocated - total) > 0.01) {
            return res.status(400).json({ message: 'Total budget must equal sum of category allocations' });
        }
        const newBudget = new Budget_1.default({
            name,
            startDate,
            endDate,
            total,
            categories,
            notes,
            createdBy: req.user._id
        });
        const savedBudget = await newBudget.save();
        return res.status(201).json(savedBudget);
    }
    catch (error) {
        console.error('Error creating budget:', error);
        if (error instanceof mongoose_1.default.Error.ValidationError) {
            return res.status(400).json({ message: 'Validation error', errors: error.errors });
        }
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.createBudget = createBudget;
const updateBudget = async (req, res) => {
    try {
        const { name, startDate, endDate, total, categories, notes } = req.body;
        const budget = await Budget_1.default.findById(req.params.id);
        if (!budget) {
            return res.status(404).json({ message: 'Budget not found' });
        }
        if (categories) {
            const totalAllocated = categories.reduce((sum, category) => sum + category.allocated, 0);
            if (Math.abs(totalAllocated - total) > 0.01) {
                return res.status(400).json({ message: 'Total budget must equal sum of category allocations' });
            }
        }
        const updatedBudget = await Budget_1.default.findByIdAndUpdate(req.params.id, { $set: { name, startDate, endDate, total, categories, notes } }, { new: true, runValidators: true });
        return res.status(200).json(updatedBudget);
    }
    catch (error) {
        console.error('Error updating budget:', error);
        if (error instanceof mongoose_1.default.Error.ValidationError) {
            return res.status(400).json({ message: 'Validation error', errors: error.errors });
        }
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.updateBudget = updateBudget;
const deleteBudget = async (req, res) => {
    try {
        if (req.user.role !== roles_1.UserRole.ADMIN) {
            return res.status(403).json({ message: 'Not authorized to delete budgets' });
        }
        const budget = await Budget_1.default.findById(req.params.id);
        if (!budget) {
            return res.status(404).json({ message: 'Budget not found' });
        }
        await Budget_1.default.findByIdAndDelete(req.params.id);
        return res.status(200).json({ message: 'Budget deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting budget:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.deleteBudget = deleteBudget;
//# sourceMappingURL=budgetController.js.map