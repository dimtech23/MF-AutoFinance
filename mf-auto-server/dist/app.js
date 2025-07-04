"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const body_parser_1 = __importDefault(require("body-parser"));
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const loginRoute_1 = require("./routes/loginRoute");
const registrationRoute_1 = require("./routes/registrationRoute");
const setupRoute_1 = require("./routes/setupRoute");
const clientRoute_1 = require("./routes/clientRoute");
const invoiceRoute_1 = require("./routes/invoiceRoute");
const budgetRoute_1 = require("./routes/budgetRoute");
const userRoutes_1 = require("./routes/userRoutes");
const logoutRoute_1 = __importDefault(require("./routes/logoutRoute"));
const dashboardRoute_1 = require("./routes/dashboardRoute");
const appointmentRoute_1 = require("./routes/appointmentRoute");
const expenseRoute_1 = require("./routes/expenseRoute");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = parseInt(process.env.PORT || "4000", 10);
const isDevelopment = process.env.NODE_ENV !== "production";
process.on('uncaughtException', (error) => {
    console.error('UNCAUGHT EXCEPTION - keeping process alive:', error);
});
const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://mfautosfinance.com",
    "https://server.mfautosfinance.com"
];
process.on('uncaughtException', (error) => {
    console.error('UNCAUGHT EXCEPTION - keeping process alive:', error);
});
app.use((_req, res, next) => {
    const origin = _req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    else {
        res.header('Access-Control-Allow-Origin', 'https://mfautosfinance.com');
    }
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    if (_req.method === 'OPTIONS') {
        console.log(`Handling OPTIONS preflight from origin: ${origin || 'unknown'}`);
        res.status(204).end();
        return;
    }
    next();
});
app.use((req, _res, next) => {
    console.log(`${new Date().toISOString()} [${req.method}] ${req.originalUrl} - Origin: ${req.headers.origin || 'unknown'}`);
    next();
});
const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
    console.error("MONGO_URI is not set in .env file.");
    process.exit(1);
}
mongoose_1.default
    .connect(mongoUri)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("MongoDB connection error:", err));
app.get('/cors-test', (req, res) => {
    res.status(200).json({
        message: 'CORS test successful',
        origin: req.headers.origin || 'unknown',
        headers: {
            'access-control-allow-origin': res.getHeader('Access-Control-Allow-Origin'),
            'access-control-allow-credentials': res.getHeader('Access-Control-Allow-Credentials')
        }
    });
});
app.use(body_parser_1.default.json({ limit: '50mb' }));
app.use(body_parser_1.default.urlencoded({ limit: '50mb', extended: true }));
app.use("/auth", loginRoute_1.router);
app.use("/auth", registrationRoute_1.router);
app.use("/auth", logoutRoute_1.default);
app.use("/api/clients", clientRoute_1.clientRouter);
app.use("/api/invoices", invoiceRoute_1.invoiceRouter);
app.use("/api/users", userRoutes_1.router);
app.use("/api/budgets", budgetRoute_1.budgetRouter);
app.use("/api/dashboard", dashboardRoute_1.dashboardRouter);
app.use("/api/appointments", appointmentRoute_1.appointmentRouter);
app.use("/api/expenses", expenseRoute_1.expenseRouter);
app.use("/setup", setupRoute_1.router);
app.get("/test-db", async (_req, res) => {
    var _a;
    try {
        if (mongoose_1.default.connection.readyState === 1) {
            const dbName = (_a = mongoose_1.default.connection.db) === null || _a === void 0 ? void 0 : _a.databaseName;
            res.status(200).json({
                message: "Database connection successful!",
                status: "connected",
                database: dbName
            });
        }
        else {
            res.status(500).json({
                message: "Database not connected!",
                status: mongoose_1.default.connection.readyState
            });
        }
    }
    catch (error) {
        console.error("Database test error:", error);
        res.status(500).json({ message: "Database connection error", error });
    }
});
app.get("/", (_req, res) => {
    res.status(200).json({
        message: "Auto Garage Management API is running",
        environment: process.env.NODE_ENV || 'development',
        version: "1.0.0"
    });
});
app.get("/api", (_req, res) => {
    res.status(200).json({
        message: "Auto Garage Management API endpoints available",
        docs: "See documentation for available endpoints",
        environment: process.env.NODE_ENV || 'development'
    });
});
app.get("/api/expenses-test", (_req, res) => {
    res.status(200).json({
        message: "Expenses API is working",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});
if (!isDevelopment) {
    console.log("Running in production mode, configuring frontend serving");
    const basePath = process.env.REACT_APP_BASE_URL || '/mf-autofinance';
    console.log(`Using base path: ${basePath} for frontend routes`);
    const frontendBuildPath = path_1.default.join(__dirname, '../client/build');
    if (fs_1.default.existsSync(frontendBuildPath)) {
        console.log(`Serving static files from: ${frontendBuildPath}`);
        app.use(basePath, express_1.default.static(frontendBuildPath));
        app.get(`${basePath}/*`, (_req, res) => {
            const indexPath = path_1.default.join(frontendBuildPath, 'index.html');
            console.log(`Serving index.html from: ${indexPath} for path: ${_req.path}`);
            res.sendFile(indexPath);
        });
        app.get('/', (_req, res) => {
            res.redirect(basePath);
        });
        console.log('Frontend routing configured successfully');
    }
    else {
        console.warn(`⛔️ Frontend build directory not found at ${frontendBuildPath}`);
        console.log('Current working directory:', process.cwd());
    }
}
app.use((err, _req, res, _next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message
    });
});
app.use((req, res) => {
    console.log(`404 Not Found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        error: 'Not Found',
        message: `The requested resource was not found: ${req.originalUrl}`
    });
});
app.listen(port, "0.0.0.0", () => {
    console.log(`Server is running on port ${port}`);
    console.log(`Server environment: ${process.env.NODE_ENV || 'development'}`);
});
exports.default = app;
//# sourceMappingURL=app.js.map