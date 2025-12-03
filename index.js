import mongoose from "mongoose";
const { connect } = mongoose;
import http from "http";
import express, { json } from "express";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import hpp from "hpp";
import cors from "./corsConfig.js";
import indexRoutes from "./routes/indexRoutes.js";

dotenv.config({ path: "./.env" });
// Check required environment variables
if (!process.env.DATABASE || !process.env.DATABASE_PASSWORD) {
  console.error("Environment variables DATABASE credentials are required.");
  process.exit(1);
}

const app = express();
const server = http.createServer(app);

// Connect to MongoDB
const database = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

connect(database)
  .then(() => console.log("DB connection successfully!"))
  .catch((err) => {
    console.error("DB connection error:", err.message);
    process.exit(1);
  });

// Start the server
const port = process.env.PORT || 7000;
server.listen(port, () => {
  console.log(`Application is running on port ${port}`);
});

// Handle process errors
process.on("unhandledRejection", (err) => {
  console.log("err.....", err);
  console.error("UNHANDLED REJECTION!!!!! shutting down ......", err.message);
  server.close(() => process.exit(1));
});

process.on("SIGINT", () => {
  console.log("SIGINT received. Shutting down gracefully.");
  mongoose.connection.close(() => {
    console.log("Mongoose connection closed.");
    process.exit(0);
  });
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully.");
  mongoose.connection.close(() => {
    console.log("Mongoose connection closed.");
    process.exit(0);
  });
});

app.use(cors);

// Set security HTTP headers
app.use(helmet());

// Limit request rate
const limiter = rateLimit({
  max: 150000,
  windowMs: 60 * 60 * 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again in an hour",
});

app.use("/api", limiter);

// Trust proxy
app.set("trust proxy", 1);

// Body parser
app.use(
  json({
    limit: "25MB",
  })
);

// Data sanitization
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

// Parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health and test routes
app.get("/health", (req, res) => {
  res.json({ message: "Welcome to the Reda application." });
});

// Main API routes
app.use("/api/v1", indexRoutes);

export default app;
