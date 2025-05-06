import path from "path";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import bodyParser from "body-parser";
import express from "express";
import fs from "fs";
import helmet from "helmet";
// import { UPLOAD_PATH } from "./multer.config";

// Import routes for garage management system
import { router as loginRouter } from "./routes/loginRoute";
import { router as registrationRouter } from "./routes/registrationRoute";
import { router as setupRouter } from "./routes/setupRoute";
import { clientRouter } from "./routes/clientRoute";
import { invoiceRouter } from "./routes/invoiceRoute";
import { budgetRouter } from "./routes/budgetRoute";
import { router as userRouter } from "./routes/userRoutes";
import logoutRouter from "./routes/logoutRoute";
import { dashboardRouter } from "./routes/dashboardRoute"; // Add dashboard routes
import { appointmentRouter } from "./routes/appointmentRoute"; // Add appointment routes

dotenv.config();

const app = express();
const port = parseInt(process.env.PORT || "4000", 10);
const isDevelopment = process.env.NODE_ENV !== "production";

// CORS configuration
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001", "http://mfautousfinance.com", "'http://172.20.10.6:3000'"],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

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

// Helmet setup - modified to be more permissive during development
if (!isDevelopment) {
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          imgSrc: ["'self'", "data:"],
          connectSrc: ["'self'", "http://mfautousfinance.com"]
        },
      },
    })
  );
} else {
  // More relaxed for development
  app.use(helmet({ contentSecurityPolicy: false }));
}

// Middleware for parsing JSON and form data
app.use(bodyParser.json());
// app.use("/uploads", express.static(UPLOAD_PATH));

// API routes
app.use("/auth", loginRouter);
app.use("/auth", registrationRouter);
app.use("/auth", logoutRouter);
app.use("/api/clients", clientRouter);
app.use("/api/invoices", invoiceRouter);
app.use("/api/users", userRouter);
app.use("/setup", setupRouter);
app.use("/api/budgets", budgetRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/appointments", appointmentRouter);

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

// Development API root route
app.get("/", (req, res) => {
  res.status(200).json({ message: "Auto Garage Management API is running" });
});

 // Production configuration to serve frontend
if (!isDevelopment) {
  console.log("Running in production mode, looking for frontend build");
  // Try multiple possible paths for the frontend build
  const possiblePaths = [
    path.join(__dirname, '../client/build'),
    path.join(__dirname, '../build'),
    path.join(__dirname, '../../client/build'),
    path.join(__dirname, '../../mf-auto-client/build'),
    path.join(__dirname, '../frontend/build'),
    path.join(__dirname, '/app/client/build'),
    path.join(__dirname, '/app/build'),
    path.join(__dirname, '../../../mf-auto-client/build'),
    path.join(process.cwd(), '../client/build'),
    path.join(process.cwd(), '../mf-auto-client/build'),
    path.join(process.cwd(), './build'),
    // Add more paths if needed
  ];
  
  console.log("Possible frontend paths to check:");
  possiblePaths.forEach((p, i) => console.log(`[${i}] ${p}`));
  
  // Find the first path that exists
  let frontendBuildPath = '';
  for (const testPath of possiblePaths) {
    try {
      console.log(`Checking path: ${testPath}`);
      if (fs.existsSync(testPath)) {
        frontendBuildPath = testPath;
        console.log(`✅ Found frontend build at: ${frontendBuildPath}`);
        break;
      } else {
        console.log(`❌ Path not found: ${testPath}`);
      }
    } catch (err: any) { // Using the any type to handle the error
      // Continue trying other paths if one fails
      console.log(`⚠️ Error checking path ${testPath}: ${err?.message || 'Unknown error'}`);
    }
  }
  
  if (frontendBuildPath) {
    console.log(`Serving static files from: ${frontendBuildPath}`);
    console.log(`Route path: /mf-autofinance`);
    
    // Serve static files from the React app build directory
    app.use('/mf-autofinance', express.static(frontendBuildPath));
    
    // For any routes that don't match API routes, serve the React app
    app.get('/mf-autofinance/*', (req, res) => {
      const indexPath = path.join(frontendBuildPath, 'index.html');
      console.log(`Serving index.html from: ${indexPath}`);
      res.sendFile(indexPath);
    });
    
    // Log successful setup
    console.log('Frontend routing configured successfully');
  } else {
    console.warn('⛔️ Could not find frontend build directory. Static files will not be served.');
    console.log('Current working directory:', process.cwd());
    try {
      console.log('Directory contents:', fs.readdirSync(process.cwd()));
    } catch (err: any) {
      console.error('Error reading directory:', err?.message || 'Unknown error');
    }
  }
}

// Start server - Changed from localhost to 0.0.0.0 to allow external connections
app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on port ${port}`);
  console.log(
    `Using ${
      process.env.NODE_ENV === "production"
        ? "production uploads directory"
        : "local storage"
    } for file uploads`
  );
  console.log(`Running in ${isDevelopment ? 'development' : 'production'} mode`);
});