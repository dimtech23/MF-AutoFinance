import { Request, Response } from 'express';
export declare const getAllBudgets: (_req: Request, res: Response) => Promise<Response>;
export declare const getBudgetById: (req: Request, res: Response) => Promise<Response>;
export declare const createBudget: (req: Request, res: Response) => Promise<Response>;
export declare const updateBudget: (req: Request, res: Response) => Promise<Response>;
export declare const deleteBudget: (req: Request, res: Response) => Promise<Response>;
