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
const isDevelopment = process.env.NODE_ENV === "development";

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Credentials", "true");
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});


// CORS configuration - SIMPLIFIED VERSION
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001"],
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

// Register routes
app.use("/auth", loginRouter);
app.use("/auth", registrationRouter);
app.use("/auth", logoutRouter);

// API routes
app.use("/api/clients", clientRouter);
app.use("/api/invoices", invoiceRouter);
app.use("/api/users", userRouter);
app.use("/setup", setupRouter);
app.use("/api/budgets", budgetRouter);
app.use("/api/dashboard", dashboardRouter); // Add dashboard routes
app.use("/api/appointments", appointmentRouter); // Add appointment routes

// Root route
app.get("/", (req, res) => {
  res.status(200).json({ message: "Auto Garage Management API is running" });
});

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

// Start server
app.listen(port, "localhost", () => {
  console.log(`Server is running on http://localhost:${port}`);
  console.log(
    `Using ${
      process.env.NODE_ENV === "production"
        ? "production uploads directory"
        : "local storage"
    } for file uploads`
  );
});