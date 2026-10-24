import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { allow } from "../middleware/role.js";
import { listingUpload } from "../middleware/upload.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as controller from "../controllers/listingController.js";

const router = Router();
router.get("/", asyncHandler(controller.list));
router.get("/my", auth, allow("owner"), asyncHandler(controller.myListings));
router.post(
  "/",
  auth,
  allow("owner"),
  listingUpload.array("images", 6),
  asyncHandler(controller.create),
);
router.get("/:id", asyncHandler(controller.detail));
router.put(
  "/:id",
  auth,
  allow("owner"),
  listingUpload.array("images", 6),
  asyncHandler(controller.update),
);
router.delete("/:id", auth, allow("owner", "admin"), asyncHandler(controller.remove));
export default router;
