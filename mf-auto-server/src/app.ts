import path from "path";
import dotenv from "dotenv";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import express from "express";
import fs from "fs";

// Import routes for garage management system
import { router as loginRouter } from "./routes/loginRoute";
import { router as registrationRouter } from "./routes/registrationRoute";
import { router as setupRouter } from "./routes/setupRoute";
import { clientRouter } from "./routes/clientRoute";
import { invoiceRouter } from "./routes/invoiceRoute";
import { budgetRouter } from "./routes/budgetRoute";
import { router as userRouter } from "./routes/userRoutes";
import logoutRouter from "./routes/logoutRoute";
import { dashboardRouter } from "./routes/dashboardRoute";
import { appointmentRouter } from "./routes/appointmentRoute";

dotenv.config();

const app = express();
const port = parseInt(process.env.PORT || "4000", 10);
const isDevelopment = process.env.NODE_ENV !== "production";

process.on('uncaughtException', (error) => {
  console.error('UNCAUGHT EXCEPTION - keeping process alive:', error);
  // Don't exit the process
});

// CORS Configuration - CONSOLIDATED VERSION
const allowedOrigins = [
  "http://localhost:3000", 
  "http://localhost:3001", 
  "https://mfautosfinance.com", 
  "https://server.mfautosfinance.com"
];

process.on('uncaughtException', (error) => {
  console.error('UNCAUGHT EXCEPTION - keeping process alive:', error);
  // Don't exit the process
});

// Custom CORS middleware to handle all cases
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Set CORS headers for all responses
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    // Default for non-browser or unknown origins
    res.header('Access-Control-Allow-Origin', 'https://mfautosfinance.com');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle OPTIONS requests immediately and directly
  if (req.method === 'OPTIONS') {
    console.log(`Handling OPTIONS preflight from origin: ${origin || 'unknown'}`);
    return res.status(204).end(); // 204 is more standard for OPTIONS
  }
  
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} [${req.method}] ${req.originalUrl} - Origin: ${req.headers.origin || 'unknown'}`);
  next();
});

// Connect to MongoDB
const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error("MONGO_URI is not set in .env file.");
  process.exit(1);
}

mongoose
  .connect(mongoUri)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// CORS TEST ENDPOINT
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

// Body parser middleware
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// API routes - CRITICAL FIX: Do NOT add /api prefix to auth routes
app.use("/auth", loginRouter);
app.use("/auth", registrationRouter);
app.use("/auth", logoutRouter);

// API routes - These SHOULD have /api prefix
app.use("/api/clients", clientRouter);
app.use("/api/invoices", invoiceRouter);
app.use("/api/users", userRouter);
app.use("/api/budgets", budgetRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/appointments", appointmentRouter);

// Setup route
app.use("/setup", setupRouter);

// Test MongoDB connection
app.get("/test-db", async (req, res) => {
  try {
    // Check connection status
    if (mongoose.connection.readyState === 1) {
      return res.status(200).json({ 
        message: "Database connection successful!",
        status: "connected",
        database: mongoose.connection.db.databaseName
      });
    } else {
      return res.status(500).json({ 
        message: "Database not connected!",
        status: mongoose.connection.readyState
      });
    }
  } catch (error) {
    console.error("Database test error:", error);
    return res.status(500).json({ message: "Database connection error", error });
  }
});

// API root route - useful for health checks
app.get("/", (req, res) => {
  res.status(200).json({ 
    message: "Auto Garage Management API is running",
    environment: process.env.NODE_ENV || 'development',
    version: "1.0.0"
  });
});

// Base API route response - helps debug path issues
app.get("/api", (req, res) => {
  res.status(200).json({ 
    message: "Auto Garage Management API endpoints available",
    docs: "See documentation for available endpoints",
    environment: process.env.NODE_ENV || 'development'
  });
});

// Production configuration to serve frontend - SIMPLIFIED
if (!isDevelopment) {
  console.log("Running in production mode, configuring frontend serving");
  
  // Define the base path for the frontend application
  const basePath = process.env.REACT_APP_BASE_URL || '/mf-autofinance';
  console.log(`Using base path: ${basePath} for frontend routes`);
  
  // Set a single, fixed path for the frontend build
  const frontendBuildPath = path.join(__dirname, '../client/build');
  
  // Check if the path exists
  if (fs.existsSync(frontendBuildPath)) {
    console.log(`Serving static files from: ${frontendBuildPath}`);
    
    // Serve static files from the React app build directory
    app.use(basePath, express.static(frontendBuildPath));
    
    // For any routes that don't match API routes, serve the React app
    app.get(`${basePath}/*`, (req, res) => {
      const indexPath = path.join(frontendBuildPath, 'index.html');
      console.log(`Serving index.html from: ${indexPath} for path: ${req.path}`);
      res.sendFile(indexPath);
    });
    
    // Also handle root path redirects to the base path if needed
    app.get('/', (req, res) => {
      res.redirect(basePath);
    });
    
    console.log('Frontend routing configured successfully');
  } else {
    console.warn(`⛔️ Frontend build directory not found at ${frontendBuildPath}`);
    console.log('Current working directory:', process.cwd());
  }
}

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message
  });
});

// Handle 404 routes
app.use((req, res) => {
  console.log(`404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    error: 'Not Found',
    message: `The requested resource was not found: ${req.originalUrl}`
  });
});

// Start server - Listen on all interfaces (0.0.0.0) to allow external connections
app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Server environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;