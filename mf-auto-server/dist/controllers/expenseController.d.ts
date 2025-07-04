import { Request, Response } from 'express';
export declare const getAllExpenses: (req: Request, res: Response) => Promise<Response>;
export declare const getExpenseById: (req: Request, res: Response) => Promise<Response>;
export declare const createExpense: (req: Request, res: Response) => Promise<Response>;
export declare const updateExpense: (req: Request, res: Response) => Promise<Response>;
export declare const deleteExpense: (req: Request, res: Response) => Promise<Response>;
export declare const updateExpenseStatus: (req: Request, res: Response) => Promise<Response>;
export declare const getExpenseStats: (req: Request, res: Response) => Promise<Response>;
export declare const uploadReceipt: (req: Request, res: Response) => Promise<Response>;
