"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadReceipt = exports.getExpenseStats = exports.updateExpenseStatus = exports.deleteExpense = exports.updateExpense = exports.createExpense = exports.getExpenseById = exports.getAllExpenses = void 0;
const Expense_1 = __importDefault(require("../models/Expense"));
const getAllExpenses = async (req, res) => {
    try {
        const { category, status, startDate, endDate, supplier, paymentMethod, page = 1, limit = 50, sortBy = 'date', sortOrder = 'desc' } = req.query;
        const filter = {};
        if (category)
            filter.category = category;
        if (status)
            filter.status = status;
        if (supplier)
            filter.supplier = { $regex: supplier, $options: 'i' };
        if (paymentMethod)
            filter.paymentMethod = paymentMethod;
        if (startDate || endDate) {
            filter.date = {};
            if (startDate)
                filter.date.$gte = new Date(startDate);
            if (endDate)
                filter.date.$lte = new Date(endDate);
        }
        const skip = (Number(page) - 1) * Number(limit);
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
        const expenses = await Expense_1.default.find(filter)
            .populate('createdBy', 'name email')
            .populate('approvedBy', 'name email')
            .sort(sort)
            .skip(skip)
            .limit(Number(limit))
            .lean();
        const total = await Expense_1.default.countDocuments(filter);
        return res.status(200).json({
            expenses,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        });
    }
    catch (error) {
        console.error('Error getting expenses:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getAllExpenses = getAllExpenses;
const getExpenseById = async (req, res) => {
    try {
        const { id } = req.params;
        const expense = await Expense_1.default.findById(id)
            .populate('createdBy', 'name email')
            .populate('approvedBy', 'name email');
        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }
        return res.status(200).json(expense);
    }
    catch (error) {
        console.error('Error getting expense by ID:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getExpenseById = getExpenseById;
const createExpense = async (req, res) => {
    try {
        const authReq = req;
        const { title, description, amount, category, date, supplier, invoiceNumber, paymentMethod, notes, tags } = req.body;
        if (!title || !amount || !category) {
            return res.status(400).json({
                message: 'Title, amount, and category are required'
            });
        }
        if (amount <= 0) {
            return res.status(400).json({
                message: 'Amount must be greater than 0'
            });
        }
        const expense = new Expense_1.default({
            title,
            description,
            amount: Number(amount),
            category,
            date: date ? new Date(date) : new Date(),
            supplier,
            invoiceNumber,
            paymentMethod: paymentMethod || 'cash',
            notes,
            tags: tags || [],
            createdBy: authReq.user._id
        });
        await expense.save();
        await expense.populate('createdBy', 'name email');
        return res.status(201).json(expense);
    }
    catch (error) {
        console.error('Error creating expense:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.createExpense = createExpense;
const updateExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        delete updateData.createdBy;
        delete updateData.approvedBy;
        delete updateData.approvedAt;
        const expense = await Expense_1.default.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).populate('createdBy', 'name email')
            .populate('approvedBy', 'name email');
        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }
        return res.status(200).json(expense);
    }
    catch (error) {
        console.error('Error updating expense:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateExpense = updateExpense;
const deleteExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const expense = await Expense_1.default.findByIdAndDelete(id);
        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }
        return res.status(200).json({ message: 'Expense deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting expense:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.deleteExpense = deleteExpense;
const updateExpenseStatus = async (req, res) => {
    try {
        const authReq = req;
        const { id } = req.params;
        const { status } = req.body;
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({
                message: 'Status must be either "approved" or "rejected"'
            });
        }
        const updateData = {
            status,
            approvedAt: new Date()
        };
        if (status === 'approved') {
            updateData.approvedBy = authReq.user._id;
        }
        const expense = await Expense_1.default.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).populate('createdBy', 'name email')
            .populate('approvedBy', 'name email');
        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }
        return res.status(200).json(expense);
    }
    catch (error) {
        console.error('Error updating expense status:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateExpenseStatus = updateExpenseStatus;
const getExpenseStats = async (req, res) => {
    var _a;
    try {
        const { startDate, endDate, category } = req.query;
        const filter = {};
        if (startDate || endDate) {
            filter.date = {};
            if (startDate)
                filter.date.$gte = new Date(startDate);
            if (endDate)
                filter.date.$lte = new Date(endDate);
        }
        if (category)
            filter.category = category;
        const totalExpenses = await Expense_1.default.aggregate([
            { $match: filter },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const expensesByCategory = await Expense_1.default.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: '$category',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { total: -1 } }
        ]);
        const expensesByStatus = await Expense_1.default.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: '$status',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);
        const currentYear = new Date().getFullYear();
        const monthlyExpenses = await Expense_1.default.aggregate([
            {
                $match: {
                    ...filter,
                    date: {
                        $gte: new Date(currentYear, 0, 1),
                        $lt: new Date(currentYear + 1, 0, 1)
                    }
                }
            },
            {
                $group: {
                    _id: { $month: '$date' },
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);
        return res.status(200).json({
            totalExpenses: ((_a = totalExpenses[0]) === null || _a === void 0 ? void 0 : _a.total) || 0,
            expensesByCategory,
            expensesByStatus,
            monthlyExpenses
        });
    }
    catch (error) {
        console.error('Error getting expense stats:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getExpenseStats = getExpenseStats;
const uploadReceipt = async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        const expense = await Expense_1.default.findByIdAndUpdate(id, {
            receipt: req.file.filename,
            receiptPath: req.file.path
        }, { new: true }).populate('createdBy', 'name email')
            .populate('approvedBy', 'name email');
        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }
        return res.status(200).json(expense);
    }
    catch (error) {
        console.error('Error uploading receipt:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.uploadReceipt = uploadReceipt;
//# sourceMappingURL=expenseController.js.map