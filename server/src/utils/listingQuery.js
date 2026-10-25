/** Build reusable Mongo filters, sort order, and pagination for listing search. */
export function buildListingQuery(query = {}) {
  const {
    city,
    propertyType,
    minRent,
    maxRent,
    availableFor,
    furnishing,
    search,
    sort = "newest",
    page = 1,
    limit = 12,
  } = query;

  const filter = { isAvailable: true };
  if (city) filter.city = { $regex: escapeRegex(String(city)), $options: "i" };
  if (propertyType) filter.propertyType = propertyType;
  if (availableFor) filter.availableFor = availableFor;
  if (furnishing) filter.furnishing = furnishing;

  let min = parseNonNegativeNumber(minRent);
  let max = parseNonNegativeNumber(maxRent);
  // Ignore contradictory ranges rather than creating a query that silently returns no results.
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
    filter.$or = ["title", "description", "locality", "city"].map((field) => ({
      [field]: { $regex: String(search), $options: "i" },
    }));
  }

  const sortOrder =
    sort === "rentLowHigh"
      ? { rent: 1 }
      : sort === "rentHighLow"
        ? { rent: -1 }
        : { createdAt: -1 };

  const parsedPage = parsePositiveInteger(page, 1);
  const pageSize = Math.min(48, Math.max(1, parsePositiveInteger(limit, 12)));
  return { filter, sortOrder, currentPage: parsedPage, pageSize };
}

function parseNonNegativeNumber(value) {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "number" && typeof value !== "string") return undefined;
  if (typeof value === "string" && !value.trim()) return undefined;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : undefined;
}

function parsePositiveInteger(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value !== "number" && typeof value !== "string") return fallback;
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(1, Math.floor(number));
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
