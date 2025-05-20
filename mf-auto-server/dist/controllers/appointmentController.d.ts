import { Request, Response } from 'express';
export declare const getAllAppointments: (req: Request, res: Response) => Promise<Response>;
export declare const getAppointmentById: (req: Request, res: Response) => Promise<Response>;
export declare const createAppointment: (req: Request, res: Response) => Promise<Response>;
export declare const updateAppointment: (req: Request, res: Response) => Promise<Response>;
export declare const updateAppointmentStatus: (req: Request, res: Response) => Promise<Response>;
export declare const deleteAppointment: (req: Request, res: Response) => Promise<Response>;
