import { Router } from "express";
import { authRateLimiter } from "../middleware/rateLimiter.js";
import { auth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as controller from "../controllers/authController.js";

const router = Router();
router.post("/register", authRateLimiter, asyncHandler(controller.register));
router.post("/login", authRateLimiter, asyncHandler(controller.login));
router.get("/me", auth, asyncHandler(controller.me));
router.post("/logout", controller.logout);
export default router;
