import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import { listingService } from "@/services/listingService.js";
import { savedService } from "@/services/savedService.js";
import ListingCard from "@/components/listings/ListingCard.jsx";
import Filter from "@/components/listings/Filter.jsx";
import Empty from "@/components/common/EmptyState.jsx";
import { useAuth } from "@/context/AuthContext.jsx";
import {
  availableForOptions,
  furnishingOptions,
  propertyTypes,
} from "@/utils/constants.js";

const MAX_RENT_FILTER = 100_000_000;
const RENT_VALUE_PATTERN = /^\d+(?:\.\d{1,2})?$/;

function formatOption(value) {
  if (value === "semi") return "Semi-furnished";
  return value ? value[0].toUpperCase() + value.slice(1) : value;
}

function formatRent(value) {
  return `₹${Number(value).toLocaleString("en-IN")}`;
}

function Listings() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState({ items: [], pages: 1, total: 0 });
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [searchDraft, setSearchDraft] = useState(
    () => params.get("search") || params.get("city") || "",
  );
  const [minRentDraft, setMinRentDraft] = useState(() => params.get("minRent") || "");
  const [maxRentDraft, setMaxRentDraft] = useState(() => params.get("maxRent") || "");
  const [budgetError, setBudgetError] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [savedIds, setSavedIds] = useState(() => new Set());
  const latestRequest = useRef(0);
  const { user } = useAuth();
  const queryString = params.toString();
  const urlSearch = params.get("search") || params.get("city") || "";
  const urlMinRent = params.get("minRent") || "";
  const urlMaxRent = params.get("maxRent") || "";

  useEffect(() => {
    setSearchDraft(urlSearch);
  }, [urlSearch]);

  useEffect(() => {
    setMinRentDraft(urlMinRent);
    setMaxRentDraft(urlMaxRent);
    setBudgetError("");
  }, [urlMinRent, urlMaxRent]);

  // Debounce keyword typing and normalize legacy city-only URLs.
  useEffect(() => {
    const search = searchDraft.trim();
    const currentSearch = params.get("search") || "";
    if (search === currentSearch && !params.has("city")) return undefined;

    const timeout = window.setTimeout(() => {
      const next = new URLSearchParams(params);
      if (search) next.set("search", search);
      else next.delete("search");
      next.delete("city");
      next.delete("page");
      setParams(next, { replace: true });
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [searchDraft, params, setParams]);

  // Sequence requests so slow older responses cannot replace newer search results.
  useEffect(() => {
    const requestId = ++latestRequest.current;
    let active = true;
    setBusy(true);
    setError("");

    listingService
      .list(Object.fromEntries(new URLSearchParams(queryString)))
      .then((result) => {
        if (active && requestId === latestRequest.current) setData(result);
      })
      .catch((err) => {
        if (active && requestId === latestRequest.current) {
          setError(
            err.response?.data?.message ||
              "We couldn't load homes right now. Check your connection and try again.",
          );
        }
      })
      .finally(() => {
        if (active && requestId === latestRequest.current) setBusy(false);
      });

    return () => {
      active = false;
    };
  }, [queryString, retryCount]);

  // Load saved IDs independently so an unavailable saved endpoint doesn't block search.
  useEffect(() => {
    let active = true;
    if (user?.role !== "seeker") {
      setSavedIds(new Set());
      return () => {
        active = false;
      };
    }
    savedService
      .list()
      .then(({ data: response }) => {
        if (active) {
          setSavedIds(
            new Set(
              (response.data || [])
                .map((entry) => entry.listing?._id)
                .filter(Boolean),
            ),
          );
        }
      })
      .catch(() => {
        // Listing search remains usable if the saved-list endpoint is unavailable.
      });
    return () => {
      active = false;
    };
  }, [user]);

  const val = (key) => params.get(key) || "";

  function set(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    setParams(next);
  }

  function applyBudget() {
    const min = minRentDraft.trim();
    const max = maxRentDraft.trim();
    const isValid = (value) =>
      value === "" ||
      (RENT_VALUE_PATTERN.test(value) && Number(value) <= MAX_RENT_FILTER);

    if (!isValid(min) || !isValid(max)) {
      setBudgetError("Enter a valid budget amount. Use up to two decimal places.");
      return;
    }
    if (min !== "" && max !== "" && Number(min) > Number(max)) {
      setBudgetError("Maximum budget must be greater than or equal to minimum budget.");
      return;
    }

    const next = new URLSearchParams(params);
    if (min) next.set("minRent", min);
    else next.delete("minRent");
    if (max) next.set("maxRent", max);
    else next.delete("maxRent");
    next.delete("page");
    setBudgetError("");
    setParams(next);
  }

  function clearAllFilters() {
    setSearchDraft("");
    setMinRentDraft("");
    setMaxRentDraft("");
    setBudgetError("");
    setMobileFiltersOpen(false);
    setParams({});
  }

  function removeFilter(key) {
    const next = new URLSearchParams(params);
    if (key === "search") {
      next.delete("search");
      next.delete("city");
      setSearchDraft("");
    } else if (key === "budget") {
      next.delete("minRent");
      next.delete("maxRent");
      setMinRentDraft("");
      setMaxRentDraft("");
      setBudgetError("");
    } else {
      next.delete(key);
    }
    next.delete("page");
    setParams(next);
  }

  function updateSaved(id, isSaved) {
    setSavedIds((current) => {
      const next = new Set(current);
      if (isSaved) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  const currentPage = Math.max(1, Number(val("page")) || 1);
  const activeFilters = [];
  const currentSearch = val("search") || val("city");
  if (currentSearch) {
    activeFilters.push({ key: "search", label: `Search: ${currentSearch}` });
  }
  if (val("propertyType")) {
    activeFilters.push({ key: "propertyType", label: `Type: ${formatOption(val("propertyType"))}` });
  }
  if (val("availableFor")) {
    activeFilters.push({ key: "availableFor", label: `For: ${formatOption(val("availableFor"))}` });
  }
  if (val("furnishing")) {
    activeFilters.push({ key: "furnishing", label: `Furnishing: ${formatOption(val("furnishing"))}` });
  }
  if (urlMinRent || urlMaxRent) {
    const budgetLabel = urlMinRent && urlMaxRent
      ? `${formatRent(urlMinRent)}–${formatRent(urlMaxRent)}`
      : urlMinRent
        ? `From ${formatRent(urlMinRent)}`
        : `Up to ${formatRent(urlMaxRent)}`;
    activeFilters.push({ key: "budget", label: `Budget: ${budgetLabel}` });
  }

  return (
    <main className="wrap page">
      <div className="page-heading">
        <span className="eyebrow">YOUR NEXT ADDRESS</span>
        <h1>
          Find a place to <em>belong.</em>
        </h1>
        <p>
          {data.total} {data.total === 1 ? "home" : "homes"} to explore. Your next chapter is in here somewhere.
        </p>
      </div>

      <div className="listing-search">
        <Search size={18} aria-hidden="true" />
        <input
          type="search"
          aria-label="Search listings by city, area, or keyword"
          placeholder="Search city, area or keyword"
          value={searchDraft}
          onChange={(event) => setSearchDraft(event.target.value)}
        />
        <span>
          {searchDraft.trim() ? `Searching for ${searchDraft.trim()}` : "Across India"}
        </span>
      </div>

      {activeFilters.length > 0 && (
        <div className="active-filters" aria-label="Active filters">
          <span className="active-filters-heading">Filtering by</span>
          {activeFilters.map((filter) => (
            <button
              className="active-filter-chip"
              type="button"
              key={filter.key}
              aria-label={`Remove ${filter.label} filter`}
              onClick={() => removeFilter(filter.key)}
            >
              {filter.label} <X size={14} aria-hidden="true" />
            </button>
          ))}
          <button className="active-filters-clear" type="button" onClick={clearAllFilters}>
            Clear all
          </button>
        </div>
      )}

      <div className="browse-layout">
        <div className="filters-column">
          <button
            className="filters-toggle"
            type="button"
            aria-expanded={mobileFiltersOpen}
            aria-controls="listing-filter-panel"
            onClick={() => setMobileFiltersOpen((open) => !open)}
          >
            <SlidersHorizontal size={17} aria-hidden="true" />
            {mobileFiltersOpen ? "Hide filters" : "Filters"}
            {activeFilters.length > 0 && (
              <span className="filter-count">{activeFilters.length} active</span>
            )}
            <ChevronDown className={mobileFiltersOpen ? "filters-chevron is-open" : "filters-chevron"} size={17} aria-hidden="true" />
          </button>

          <aside
            id="listing-filter-panel"
            className={`filters${mobileFiltersOpen ? " filters-open" : ""}`}
            aria-label="Filter homes"
          >
            <div className="filter-title">
              <SlidersHorizontal size={18} aria-hidden="true" /> Fine-tune
              <button type="button" onClick={clearAllFilters}>Reset</button>
            </div>
            <Filter
              label="HOME TYPE"
              name="propertyType"
              value={val("propertyType")}
              change={set}
              opts={propertyTypes}
            />
            <Filter
              label="WHO IT'S FOR"
              name="availableFor"
              value={val("availableFor")}
              change={set}
              opts={availableForOptions}
            />
            <Filter
              label="FURNISHING"
              name="furnishing"
              value={val("furnishing")}
              change={set}
              opts={furnishingOptions}
            />
            <div className="filter-block budget-filter">
              <b>MONTHLY BUDGET</b>
              <div className="rent-inputs">
                <label>
                  <span>Min rent (₹)</span>
                  <input
                    type="number"
                    min="0"
                    max={MAX_RENT_FILTER}
                    step="0.01"
                    inputMode="decimal"
                    aria-label="Minimum monthly rent in rupees"
                    placeholder="Min ₹"
                    value={minRentDraft}
                    onChange={(event) => {
                      setMinRentDraft(event.target.value);
                      setBudgetError("");
                    }}
                  />
                </label>
                <label>
                  <span>Max rent (₹)</span>
                  <input
                    type="number"
                    min="0"
                    max={MAX_RENT_FILTER}
                    step="0.01"
                    inputMode="decimal"
                    aria-label="Maximum monthly rent in rupees"
                    placeholder="Max ₹"
                    value={maxRentDraft}
                    onChange={(event) => {
                      setMaxRentDraft(event.target.value);
                      setBudgetError("");
                    }}
                  />
                </label>
              </div>
              {budgetError && <p className="budget-error" role="alert">{budgetError}</p>}
              <button className="button button-small budget-apply" type="button" onClick={applyBudget}>
                Apply budget
              </button>
            </div>
          </aside>
        </div>

        <section className="results" aria-label="Home search results" aria-busy={busy}>
          <div className="results-head">
            <span aria-live="polite">
              {busy ? "Finding homes…" : `${data.total} ${data.total === 1 ? "home" : "homes"} you might love`}
            </span>
            <label className="sort-control">
              <span>Sort by</span>
              <select
                aria-label="Sort listings"
                value={val("sort") || "newest"}
                onChange={(event) => set("sort", event.target.value === "newest" ? "" : event.target.value)}
              >
                <option value="newest">Newest first</option>
                <option value="rentLowHigh">Rent: low to high</option>
                <option value="rentHighLow">Rent: high to low</option>
              </select>
            </label>
          </div>

          {busy ? (
            <div className="cards" aria-label="Loading listings" aria-busy="true">
              {[1, 2, 3].map((number) => <div className="skeleton" key={number} />)}
            </div>
          ) : error ? (
            <div className="empty" role="alert">
              <h2>We couldn't load homes</h2>
              <p>{error}</p>
              <button className="button" type="button" onClick={() => setRetryCount((count) => count + 1)}>
                Retry
              </button>
            </div>
          ) : data.items.length ? (
            <>
              <div className="cards">
                {data.items.map((item) => (
                  <ListingCard
                    key={item._id}
                    item={item}
                    saved={savedIds.has(item._id)}
                    onSavedChange={(isSaved) => updateSaved(item._id, isSaved)}
                  />
                ))}
              </div>
              {data.pages > 1 && (
                <nav className="pagination" aria-label="Home result pages">
                  <button
                    type="button"
                    disabled={currentPage <= 1 || busy}
                    onClick={() => set("page", String(currentPage - 1))}
                  >
                    ← Previous
                  </button>
                  <span aria-live="polite">Page {currentPage} of {data.pages}</span>
                  <button
                    type="button"
                    disabled={currentPage >= data.pages || busy}
                    onClick={() => set("page", String(currentPage + 1))}
                  >
                    Next →
                  </button>
                </nav>
              )}
            </>
          ) : (
            <div className="search-empty-state">
              <Empty
                title="No homes found just yet"
                text="Try another city or remove a filter to see more places."
              />
              {activeFilters.length > 0 && (
                <div className="search-empty-actions">
                  <p>Try removing some filters, or start a fresh search.</p>
                  <button className="button button-small" type="button" onClick={clearAllFilters}>
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default Listings;
