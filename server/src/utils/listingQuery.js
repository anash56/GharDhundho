const PROPERTY_TYPES = new Set(["room", "flat", "pg"]);
const AVAILABLE_FOR = new Set(["boys", "girls", "family", "anyone"]);
const FURNISHING_TYPES = new Set(["furnished", "semi", "unfurnished"]);
const SORTS = new Set(["newest", "rentLowHigh", "rentHighLow"]);

const MAX_CITY_LENGTH = 100;
const MAX_SEARCH_LENGTH = 120;
const MAX_RENT = 100_000_000;
const MAX_PAGE = 100_000;

/** Build sanitized Mongo filters, sort order, and pagination for listing search. */
export function buildListingQuery(query = {}) {
  const city = readString(query.city, MAX_CITY_LENGTH);
  const search = readString(query.search, MAX_SEARCH_LENGTH);
  const propertyType = readEnum(query.propertyType, PROPERTY_TYPES);
  const availableFor = readEnum(query.availableFor, AVAILABLE_FOR);
  const furnishing = readEnum(query.furnishing, FURNISHING_TYPES);
  const requestedSort = readString(query.sort, 30);
  const sort = requestedSort && SORTS.has(requestedSort) ? requestedSort : "newest";

  const filter = { isAvailable: true };

  if (city) filter.city = { $regex: escapeRegex(city), $options: "i" };
  if (propertyType) filter.propertyType = propertyType;
  if (availableFor) filter.availableFor = availableFor;
  if (furnishing) filter.furnishing = furnishing;

  let min = parseNonNegativeNumber(query.minRent);
  let max = parseNonNegativeNumber(query.maxRent);
  // Ignore invalid or contradictory ranges rather than producing a NaN Mongo query.
  if (min !== undefined && max !== undefined && min > max) {
    min = undefined;
    max = undefined;
  }
  if (min !== undefined || max !== undefined) {
    filter.rent = {
      ...(min !== undefined ? { $gte: min } : {}),
      ...(max !== undefined ? { $lte: max } : {}),
    };
  }

  if (search) {
    const safeSearch = escapeRegex(search);
    filter.$or = ["title", "description", "locality", "city"].map((field) => ({
      [field]: { $regex: safeSearch, $options: "i" },
    }));
  }

  const sortOrder =
    sort === "rentLowHigh"
      ? { rent: 1 }
      : sort === "rentHighLow"
        ? { rent: -1 }
        : { createdAt: -1 };

  return {
    filter,
    sortOrder,
    currentPage: parsePositiveInteger(query.page, 1, MAX_PAGE),
    pageSize: parsePositiveInteger(query.limit, 12, 48),
  };
}

function readString(value, maxLength) {
  if (
    typeof value !== "string" &&
    typeof value !== "number" &&
    typeof value !== "boolean"
  ) {
    return undefined;
  }

  const normalized = String(value).trim();
  if (!normalized || normalized.length > maxLength) return undefined;
  return normalized;
}

function readEnum(value, allowedValues) {
  const normalized = readString(value, 40);
  return normalized && allowedValues.has(normalized) ? normalized : undefined;
}

function parseNonNegativeNumber(value) {
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  if (typeof value === "string" && !/^\d+(?:\.\d{1,2})?$/.test(value.trim())) {
    return undefined;
  }
  if (value === "") return undefined;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 && number <= MAX_RENT
    ? number
    : undefined;
}

function parsePositiveInteger(value, fallback, max) {
  if (typeof value !== "string" && typeof value !== "number") return fallback;
  if (typeof value === "string" && !/^\d+$/.test(value.trim())) return fallback;
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 0) return fallback;
  return Math.max(1, Math.min(Math.floor(number), max));
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
