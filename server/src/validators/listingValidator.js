
import ApiError from "../utils/ApiError.js";

const CREATE_FIELDS = new Set([
  "title",
  "description",
  "city",
  "locality",
  "address",
  "rent",
  "deposit",
  "propertyType",
  "availableFor",
  "furnishing",
  "amenities",
  "isAvailable",
]);

const UPDATE_FIELDS = new Set([...CREATE_FIELDS, "removedImages"]);

const ENUMS = {
  propertyType: ["room", "flat", "pg"],
  availableFor: ["boys", "girls", "family", "anyone"],
  furnishing: ["furnished", "semi", "unfurnished"],
};

const TEXT_LIMITS = {
  title: 120,
  description: 5000,
  city: 100,
  locality: 120,
  address: 300,
};

function rejectUnknownFields(body, allowedFields) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ApiError(400, "Listing data must be an object");
  }

  const unknown = Object.keys(body).filter(
    (key) => !allowedFields.has(key),
  );

  if (unknown.length) {
    throw new ApiError(
      400,
      `Unsupported listing field(s): ${unknown.join(", ")}`,
    );
  }
}

function validateText(field, value) {
  if (typeof value !== "string") {
    throw new ApiError(400, `${field} must be text`);
  }

  const normalized = value.trim();

  if (!normalized) {
    throw new ApiError(400, `${field} cannot be empty`);
  }

  if (normalized.length > TEXT_LIMITS[field]) {
    throw new ApiError(
      400,
      `${field} must be ${TEXT_LIMITS[field]} characters or fewer`,
    );
  }
}

function validateMoney(field, value, { required = false } = {}) {
  if (value === undefined || value === null || value === "") {
    if (required) {
      throw new ApiError(400, `${field} is required`);
    }
    return;
  }

  if (
    (typeof value !== "number" && typeof value !== "string") ||
    (typeof value === "string" && !value.trim())
  ) {
    throw new ApiError(400, `${field} must be a valid non-negative amount`);
  }

  const amount = Number(value);

  if (
    !Number.isFinite(amount) ||
    amount < 0 ||
    amount > 100000000
  ) {
    throw new ApiError(400, `${field} must be a valid non-negative amount`);
  }
}

function validateEnum(field, value) {
  if (value !== undefined && !ENUMS[field].includes(value)) {
    throw new ApiError(400, `Invalid ${field}`);
  }
}

function validateAmenities(value) {
  if (value === undefined || value === "") return;

  const amenities = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",")
      : null;

  if (!amenities) {
    throw new ApiError(
      400,
      "Amenities must be a list or comma-separated text",
    );
  }

  if (amenities.length > 30) {
    throw new ApiError(400, "You can add up to 30 amenities");
  }

  if (
    amenities.some(
      (item) =>
        typeof item !== "string" ||
        item.trim().length === 0 ||
        item.trim().length > 60,
    )
  ) {
    throw new ApiError(
      400,
      "Each amenity must be non-empty text of 60 characters or fewer",
    );
  }
}

function validateAvailability(value) {
  if (value === undefined) return;

  if (![true, false, "true", "false"].includes(value)) {
    throw new ApiError(400, "isAvailable must be true or false");
  }
}

function validateRemovedImages(value) {
  if (value === undefined || value === "") return;

  let parsed = value;

  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      throw new ApiError(400, "Invalid removed image list");
    }
  }

  if (
    !Array.isArray(parsed) ||
    parsed.length > 6 ||
    parsed.some(
      (url) =>
        typeof url !== "string" ||
        !url.trim() ||
        url.length > 2048,
    )
  ) {
    throw new ApiError(
      400,
      "Removed images must be a list of up to 6 valid image URLs",
    );
  }
}

function validateCommonFields(body) {
  for (const field of ["title", "description", "city", "locality"]) {
    if (body[field] === undefined || body[field] === "") {
      throw new ApiError(400, `${field} is required`);
    }

    validateText(field, body[field]);
  }

  validateMoney("rent", body.rent, { required: true });
  validateMoney("deposit", body.deposit);

  if (!body.propertyType) {
    throw new ApiError(400, "propertyType is required");
  }

  for (const field of Object.keys(ENUMS)) {
    validateEnum(field, body[field]);
  }

  if (body.address !== undefined && body.address !== "") {
    validateText("address", body.address);
  }

  validateAmenities(body.amenities);
  validateAvailability(body.isAvailable);
}

/** Validate a new listing and reject client-controlled fields. */
export function validateNewListing(body) {
  rejectUnknownFields(body, CREATE_FIELDS);
  validateCommonFields(body);
}

/** Validate supplied edits before applying an update. */
export function validateListingUpdates(body) {
  rejectUnknownFields(body, UPDATE_FIELDS);

  if (Object.keys(body).length === 0) {
    throw new ApiError(400, "Provide at least one listing field to update");
  }

  if (
    Object.keys(body).every((field) => field === "removedImages") &&
    body.removedImages === undefined
  ) {
    throw new ApiError(400, "Provide at least one listing field to update");
  }

  for (const field of Object.keys(TEXT_LIMITS)) {
    if (body[field] !== undefined) {
      if (field === "address" && body[field] === "") continue;
      validateText(field, body[field]);
    }
  }

  validateMoney("rent", body.rent, {
    required: body.rent !== undefined,
  });
  validateMoney("deposit", body.deposit);

  for (const field of Object.keys(ENUMS)) {
    validateEnum(field, body[field]);
  }

  validateAmenities(body.amenities);
  validateAvailability(body.isAvailable);
  validateRemovedImages(body.removedImages);
}
