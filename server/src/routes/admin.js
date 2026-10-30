import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { allow } from "../middleware/role.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as controller from "../controllers/adminController.js";

const router = Router();

// Every admin endpoint requires a valid session and the current database admin role.
router.use(auth, allow("admin"));
router.get("/overview", asyncHandler(controller.overview));
router.get("/listings", asyncHandler(controller.listings));
router.patch("/listings/:id/moderation", asyncHandler(controller.moderateListing));

export default router;
