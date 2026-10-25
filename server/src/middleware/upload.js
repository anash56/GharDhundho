import multer from "multer";
import ApiError from "../utils/ApiError.js";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILES = 6;

const ALLOWED_IMAGES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

function hasImageSignature(buffer, mimetype) {
  if (!Buffer.isBuffer(buffer)) return false;

  switch (mimetype) {
    case "image/jpeg":
      return (
        buffer.length >= 3 &&
        buffer[0] === 0xff &&
        buffer[1] === 0xd8 &&
        buffer[2] === 0xff
      );

    case "image/png":
      return buffer.length >= PNG_SIGNATURE.length && buffer.subarray(0, 8).equals(PNG_SIGNATURE);

    case "image/gif": {
      if (buffer.length < 6) return false;
      const signature = buffer.toString("ascii", 0, 6);
      return signature === "GIF87a" || signature === "GIF89a";
    }

    case "image/webp":
      return (
        buffer.length >= 12 &&
        buffer.toString("ascii", 0, 4) === "RIFF" &&
        buffer.toString("ascii", 8, 12) === "WEBP"
      );

    default:
      return false;
  }
}

export function validateImageFiles(files = []) {
  if (!Array.isArray(files)) {
    throw new ApiError(400, "Invalid uploaded image list.");
  }

  if (files.length > MAX_FILES) {
    throw new ApiError(400, "You can add up to 6 images in total.");
  }

  for (const file of files) {
    if (!ALLOWED_IMAGES.has(file.mimetype)) {
      throw new ApiError(400, "Choose a JPEG, PNG, WEBP, or GIF image.");
    }

    if (!hasImageSignature(file.buffer, file.mimetype)) {
      throw new ApiError(400, "An uploaded file does not match its declared image type.");
    }
  }

  return true;
}

export function validateUploadedImages(req, res, next) {
  try {
    validateImageFiles(req.files || []);
    next();
  } catch (error) {
    next(error);
  }
}

export const listingUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES,
    fields: 32,
    fieldSize: 16 * 1024,
    parts: MAX_FILES + 32,
    headerPairs: 100,
  },
  fileFilter: (req, file, callback) => {
    // Keep this filter synchronous; async fileFilter implementations can introduce
    // request-teardown races in affected Multer versions.
    if (!ALLOWED_IMAGES.has(file.mimetype)) {
      return callback(new ApiError(400, "Choose a JPEG, PNG, WEBP, or GIF image."));
    }
    callback(null, true);
  },
});
