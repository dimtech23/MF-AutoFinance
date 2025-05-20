import { Request, Response, NextFunction } from "express";
declare const setResponseObject: (req: Request, res: Response, next: NextFunction) => void;
export default setResponseObject;
