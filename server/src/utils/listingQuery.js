/** Build reusable Mongo filters, sort order, and pagination for listing search. */
export function buildListingQuery(query) {
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
  if (minRent || maxRent) {
    filter.rent = {
      ...(minRent ? { $gte: Number(minRent) } : {}),
      ...(maxRent ? { $lte: Number(maxRent) } : {}),
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
  const currentPage = Math.max(1, Number(page));
  const pageSize = Math.min(48, Math.max(1, Number(limit)));
  return { filter, sortOrder, currentPage, pageSize };
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
