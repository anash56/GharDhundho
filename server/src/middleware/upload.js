import multer from "multer";
import ApiError from "../utils/ApiError.js";

export const listingUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 6 },
  fileFilter: (req, file, callback) => {
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) {
      return callback(new ApiError(400, "Choose a JPEG, PNG, WEBP, or GIF image."));
    }
    callback(null, true);
  },
});
