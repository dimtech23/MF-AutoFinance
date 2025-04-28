// controllers/budgetController.js
import { Request, Response } from 'express';
import Budget from '../models/Budget';
import { UserRole } from '../constants/roles';
import mongoose from 'mongoose';

// Get all budgets
export const getAllBudgets = async (req: Request, res: Response) => {
  try {
    const budgets = await Budget.find().sort({ createdAt: -1 });
    res.status(200).json(budgets);
  } catch (error) {
    console.error('Error fetching budgets:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a specific budget by ID
export const getBudgetById = async (req: Request, res: Response) => {
  try {
    const budget = await Budget.findById(req.params.id);
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }
    res.status(200).json(budget);
  } catch (error) {
    console.error('Error fetching budget:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new budget
export const createBudget = async (req: Request, res: Response) => {
  try {
    const { name, startDate, endDate, total, categories, notes } = req.body;
    
    // Validate total equals sum of allocations
    const totalAllocated = categories.reduce((sum: number, category: any) => sum + category.allocated, 0);
    if (Math.abs(totalAllocated - total) > 0.01) {
      return res.status(400).json({ message: 'Total budget must equal sum of category allocations' });
    }
    
    // Create new budget
    const newBudget = new Budget({
      name,
      startDate,
      endDate,
      total,
      categories,
      notes,
      createdBy: (req as any).user._id
    });
    
    const savedBudget = await newBudget.save();
    res.status(201).json(savedBudget);
  } catch (error) {
    console.error('Error creating budget:', error);
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Update an existing budget
export const updateBudget = async (req: Request, res: Response) => {
  try {
    const { name, startDate, endDate, total, categories, notes } = req.body;
    
    // Check if budget exists
    const budget = await Budget.findById(req.params.id);
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }
    
    // Validate total equals sum of allocations
    if (categories) {
      const totalAllocated = categories.reduce((sum: number, category: any) => sum + category.allocated, 0);
      if (Math.abs(totalAllocated - total) > 0.01) {
        return res.status(400).json({ message: 'Total budget must equal sum of category allocations' });
      }
    }
    
    // Update budget
    const updatedBudget = await Budget.findByIdAndUpdate(
      req.params.id,
      { $set: { name, startDate, endDate, total, categories, notes } },
      { new: true, runValidators: true }
    );
    
    res.status(200).json(updatedBudget);
  } catch (error) {
    console.error('Error updating budget:', error);
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a budget
export const deleteBudget = async (req: Request, res: Response) => {
  try {
    // Only Admin can delete budgets
    if ((req as any).user.role !== UserRole.ADMIN) {
      return res.status(403).json({ message: 'Not authorized to delete budgets' });
    }
    
    const budget = await Budget.findById(req.params.id);
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }
    
    await Budget.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Budget deleted successfully' });
  } catch (error) {
    console.error('Error deleting budget:', error);
    res.status(500).json({ message: 'Server error' });
  }
};