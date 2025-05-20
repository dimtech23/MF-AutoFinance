import { Request, Response } from 'express';
export declare const getDashboardStats: (req: Request, res: Response) => Promise<Response>;
export declare const getTransactions: (_req: Request, res: Response) => Promise<Response>;
export declare const getAppointments: (_req: Request, res: Response) => Promise<Response>;
export declare const getInventoryAlerts: (_req: Request, res: Response) => Promise<Response>;
