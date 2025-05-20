import { Request, Response } from 'express';
export declare const getAllUsers: (_req: Request, res: Response) => Promise<Response>;
export declare const getUserById: (req: Request, res: Response) => Promise<Response>;
export declare const updateUser: (req: Request, res: Response) => Promise<Response>;
export declare const deleteUser: (req: Request, res: Response) => Promise<Response>;
export declare const resetUserPassword: (req: Request, res: Response) => Promise<Response>;
