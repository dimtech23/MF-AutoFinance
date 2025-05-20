import mongoose, { Document } from 'mongoose';
export interface BudgetDocument extends Document {
    name: string;
    startDate: Date;
    endDate: Date;
    total: number;
    categories: {
        id: number;
        name: string;
        allocated: number;
        spent: number;
    }[];
    notes?: string;
    status: 'active' | 'upcoming' | 'completed';
    createdAt: Date;
    createdBy?: mongoose.Types.ObjectId;
}
declare const Budget: mongoose.Model<BudgetDocument, {}, {}, {}, mongoose.Document<unknown, {}, BudgetDocument, {}> & BudgetDocument & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default Budget;
