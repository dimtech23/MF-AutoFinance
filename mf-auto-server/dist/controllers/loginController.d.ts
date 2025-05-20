import { Request, Response } from 'express';
export declare const loginUser: (req: Request, res: Response) => Promise<void>;
export declare const passwordReset: (req: Request, res: Response) => Promise<void>;
export declare const verifyResetCode: (req: Request, res: Response) => Promise<void>;
export declare const updateInfo: (req: Request, res: Response) => Promise<void>;
export declare const resetPassword: (req: Request, res: Response) => Promise<void>;
