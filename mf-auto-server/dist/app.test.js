"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const app_1 = __importDefault(require("./app"));
dotenv_1.default.config();
beforeAll(async () => {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
        throw new Error('MONGO_URI is not set in .env file.');
    }
    await mongoose_1.default.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
});
afterAll(async () => {
    await mongoose_1.default.connection.close();
});
describe('Test the Express server', () => {
    it('should respond with a 201 status code on GET /', async () => {
        const response = await (0, supertest_1.default)(app_1.default).get('/');
        expect(response.status).toBe(201);
        expect(response.body).toBe("Home GET Request");
    });
});
exports.default = app_1.default;
//# sourceMappingURL=app.test.js.map