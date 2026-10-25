import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal } from "lucide-react";
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

function Listings() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState({ items: [], pages: 1, total: 0 });
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [searchDraft, setSearchDraft] = useState(
    () => params.get("search") || params.get("city") || "",
  );
  const [savedIds, setSavedIds] = useState(() => new Set());
  const latestRequest = useRef(0);
  const { user } = useAuth();
  const queryString = params.toString();

  // Support old URLs that used `city`, while the single search box uses `search`.
  const urlSearch = params.get("search") || params.get("city") || "";
  useEffect(() => {
    setSearchDraft(urlSearch);
  }, [urlSearch]);

  // Debounce typing and convert legacy city-only URLs to keyword search.
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

  // The request sequence prevents slower older responses replacing newer results.
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

  // Load the seeker's saved ids once so save buttons reflect their actual state.
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
  function updateSaved(id, isSaved) {
    setSavedIds((current) => {
      const next = new Set(current);
      if (isSaved) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  const currentPage = Math.max(1, Number(val("page")) || 1);

  return (
    <main className="wrap page">
      <div className="page-heading">
        <span className="eyebrow">YOUR NEXT ADDRESS</span>
        <h1>
          Find a place to <em>belong.</em>
        </h1>
        <p>{data.total} homes to explore. Your next chapter is in here somewhere.</p>
      </div>
      <div className="listing-search">
        <Search size={18} />
        <input
          aria-label="Search listings by city, area, or keyword"
          placeholder="Search city, area or keyword"
          value={searchDraft}
          onChange={(event) => setSearchDraft(event.target.value)}
        />
        <span>
          {searchDraft.trim() ? `Searching for ${searchDraft.trim()}` : "Across India"}
        </span>
      </div>
      <div className="browse-layout">
        <aside className="filters">
          <div className="filter-title">
            <SlidersHorizontal size={18} /> Fine-tune
            <button onClick={() => { setSearchDraft(""); setParams({}); }}>Reset</button>
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
          <label className="filter-block">
            <b>MONTHLY BUDGET</b>
            <div className="rent-inputs">
              <input
                type="number"
                min="0"
                placeholder="Min ₹"
                value={val("minRent")}
                onChange={(event) => set("minRent", event.target.value)}
              />
              <input
                type="number"
                min="0"
                placeholder="Max ₹"
                value={val("maxRent")}
                onChange={(event) => set("maxRent", event.target.value)}
              />
            </div>
          </label>
        </aside>
        <div className="results">
          <div className="results-head">
            <span>{busy ? "Finding homes…" : `${data.total} homes you might love`}</span>
            <select
              aria-label="Sort listings"
              value={val("sort") || "newest"}
              onChange={(event) => set("sort", event.target.value)}
            >
              <option value="newest">Newest first</option>
              <option value="rentLowHigh">Rent: low to high</option>
              <option value="rentHighLow">Rent: high to low</option>
            </select>
          </div>
          {busy ? (
            <div className="cards" aria-label="Loading listings" aria-busy="true">
              {[1, 2, 3].map((number) => <div className="skeleton" key={number} />)}
            </div>
          ) : error ? (
            <div className="empty" role="alert">
              <h2>We couldn't load homes</h2>
              <p>{error}</p>
              <button className="button" onClick={() => setRetryCount((count) => count + 1)}>
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
                <div className="pagination">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => set("page", String(currentPage - 1))}
                  >
                    ← Previous
                  </button>
                  <span>Page {currentPage} of {data.pages}</span>
                  <button
                    disabled={currentPage >= data.pages}
                    onClick={() => set("page", String(currentPage + 1))}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          ) : (
            <Empty
              title="No homes found just yet"
              text="Try another city or loosen your filters."
            />
          )}
        </div>
      </div>
    </main>
  );
}

export default Listings;
