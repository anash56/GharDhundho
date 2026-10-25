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
import { sanitizeMongoInput } from "./middleware/sanitizeMongoInput.js";
import { apiRateLimiter } from "./middleware/rateLimiter.js";
import { env } from "./config/env.js";
import { apiResponse } from "./utils/ApiResponse.js";

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", env.trustProxyHops);
app.set("query parser", "simple");

app.use(helmet());
app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// Apply broad API throttling and reject MongoDB operator-style input before routes run.
// Upload routes run this guard again after Multer parses multipart fields.
app.use("/api", apiRateLimiter, sanitizeMongoInput);

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
