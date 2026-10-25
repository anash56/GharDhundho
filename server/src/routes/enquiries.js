import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { allow } from "../middleware/role.js";
import { enquiryRateLimiter } from "../middleware/rateLimiter.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as controller from "../controllers/enquiryController.js";

const router = Router();

router.post(
  "/",
  auth,
  allow("seeker"),
  enquiryRateLimiter,
  asyncHandler(controller.create),
);
router.get("/received", auth, allow("owner"), asyncHandler(controller.received));
router.get("/sent", auth, allow("seeker"), asyncHandler(controller.sent));
router.patch("/:id/status", auth, allow("owner"), asyncHandler(controller.updateStatus));

export default router;
