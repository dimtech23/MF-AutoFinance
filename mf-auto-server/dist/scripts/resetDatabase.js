"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = __importDefault(require("../models/User"));
const Invoice_1 = __importDefault(require("../models/Invoice"));
const Client_1 = __importDefault(require("../models/Client"));
const Appointment_1 = __importDefault(require("../models/Appointment"));
const Budget_1 = __importDefault(require("../models/Budget"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
async function resetDatabase() {
    try {
        await mongoose_1.default.connect(process.env.MONGODB_URI || '');
        console.log('Connected to MongoDB');
        const adminUser = await User_1.default.findOne({ role: 'admin' });
        if (!adminUser) {
            throw new Error('Admin user not found. Cannot proceed with reset.');
        }
        await Promise.all([
            Invoice_1.default.deleteMany({}),
            Client_1.default.deleteMany({}),
            Appointment_1.default.deleteMany({}),
            Budget_1.default.deleteMany({})
        ]);
        await User_1.default.deleteMany({ role: { $ne: 'admin' } });
        console.log('Database reset complete. Admin user preserved.');
        console.log('Admin email:', adminUser.email);
    }
    catch (error) {
        console.error('Error resetting database:', error);
    }
    finally {
        await mongoose_1.default.disconnect();
        console.log('Disconnected from MongoDB');
    }
}
resetDatabase();
//# sourceMappingURL=resetDatabase.js.map