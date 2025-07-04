import { Request, Response } from 'express';
import Expense from '../models/Expense';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

// Get all expenses with optional filtering
export const getAllExpenses = async (req: Request, res: Response): Promise<Response> => {
  try {
    const {
      category,
      status,
      startDate,
      endDate,
      supplier,
      paymentMethod,
      page = 1,
      limit = 50,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter: any = {};
    
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (supplier) filter.supplier = { $regex: supplier as string, $options: 'i' };
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    
    // Date range filter
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate as string);
      if (endDate) filter.date.$lte = new Date(endDate as string);
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);
    
    // Build sort object
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with population
    const expenses = await Expense.find(filter)
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .lean();

    // Get total count for pagination
    const total = await Expense.countDocuments(filter);

    return res.status(200).json({
      expenses,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error getting expenses:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Get expense by ID
export const getExpenseById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    
    const expense = await Expense.findById(id)
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email');

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    return res.status(200).json(expense);
  } catch (error) {
    console.error('Error getting expense by ID:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Create new expense
export const createExpense = async (req: Request, res: Response): Promise<Response> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const {
      title,
      description,
      amount,
      category,
      date,
      supplier,
      invoiceNumber,
      paymentMethod,
      notes,
      tags
    } = req.body;

    // Validate required fields
    if (!title || !amount || !category) {
      return res.status(400).json({ 
        message: 'Title, amount, and category are required' 
      });
    }

    // Validate amount
    if (amount <= 0) {
      return res.status(400).json({ 
        message: 'Amount must be greater than 0' 
      });
    }

    // Create expense
    const expense = new Expense({
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

    // Populate user details
    await expense.populate('createdBy', 'name email');

    return res.status(201).json(expense);
  } catch (error) {
    console.error('Error creating expense:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Update expense
export const updateExpense = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData.createdBy;
    delete updateData.approvedBy;
    delete updateData.approvedAt;

    const expense = await Expense.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email')
     .populate('approvedBy', 'name email');

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    return res.status(200).json(expense);
  } catch (error) {
    console.error('Error updating expense:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete expense
export const deleteExpense = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    
    const expense = await Expense.findByIdAndDelete(id);
    
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    return res.status(200).json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Approve/reject expense
export const updateExpenseStatus = async (req: Request, res: Response): Promise<Response> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        message: 'Status must be either "approved" or "rejected"' 
      });
    }

    const updateData: any = {
      status,
      approvedAt: new Date()
    };

    if (status === 'approved') {
      updateData.approvedBy = authReq.user._id;
    }

    const expense = await Expense.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email')
     .populate('approvedBy', 'name email');

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    return res.status(200).json(expense);
  } catch (error) {
    console.error('Error updating expense status:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Get expense statistics
export const getExpenseStats = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { startDate, endDate, category } = req.query;

    // Build filter object
    const filter: any = {};
    
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate as string);
      if (endDate) filter.date.$lte = new Date(endDate as string);
    }
    
    if (category) filter.category = category;

    // Get total expenses
    const totalExpenses = await Expense.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Get expenses by category
    const expensesByCategory = await Expense.aggregate([
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

    // Get expenses by status
    const expensesByStatus = await Expense.aggregate([
      { $match: filter },
      { 
        $group: { 
          _id: '$status', 
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        } 
      }
    ]);

    // Get monthly expenses for the current year
    const currentYear = new Date().getFullYear();
    const monthlyExpenses = await Expense.aggregate([
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
      totalExpenses: totalExpenses[0]?.total || 0,
      expensesByCategory,
      expensesByStatus,
      monthlyExpenses
    });
  } catch (error) {
    console.error('Error getting expense stats:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Upload receipt for expense
export const uploadReceipt = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const expense = await Expense.findByIdAndUpdate(
      id,
      { 
        receipt: req.file.filename,
        receiptPath: req.file.path
      },
      { new: true }
    ).populate('createdBy', 'name email')
     .populate('approvedBy', 'name email');

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    return res.status(200).json(expense);
  } catch (error) {
    console.error('Error uploading receipt:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}; 