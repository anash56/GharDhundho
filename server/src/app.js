import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.js";
import listingRoutes from "./routes/listings.js";
import enquiryRoutes from "./routes/enquiries.js";
import savedRoutes from "./routes/saved.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";
import { apiResponse } from "./utils/ApiResponse.js";

const app = express();
app.use(helmet());
app.use(
  cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }),
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.get("/api/health", (req, res) =>
  res.json(apiResponse("GharDhundho API is running", null)),
);
app.use("/api/auth", authRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/enquiries", enquiryRoutes);
app.use("/api/saved", savedRoutes);
app.use(notFound);
app.use(errorHandler);
export default app;
