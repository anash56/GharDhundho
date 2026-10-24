import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { allow } from "../middleware/role.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as controller from "../controllers/savedController.js";

const router = Router();
router.use(auth, allow("seeker"));
router.get("/", asyncHandler(controller.list));
router.post("/:listingId", asyncHandler(controller.save));
router.delete("/:listingId", asyncHandler(controller.remove));
export default router;
