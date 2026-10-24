import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal } from "lucide-react";
import { listingService } from "@/services/listingService.js";
import ListingCard from "@/components/listings/ListingCard.jsx";
import Filter from "@/components/listings/Filter.jsx";
import Empty from "@/components/common/EmptyState.jsx";
import {
  availableForOptions,
  furnishingOptions,
  propertyTypes,
} from "@/utils/constants.js";
function Listings() {
  const [params, setParams] = useSearchParams(),
    [data, setData] = useState({ items: [], pages: 1, total: 0 }),
    [busy, setBusy] = useState(true);
  useEffect(() => {
    setBusy(true);
    listingService
      .list(Object.fromEntries(params))
      .then(setData)
      .catch(() => {})
      .finally(() => setBusy(false));
  }, [params]);
  const val = (k) => params.get(k) || "";
  function set(k, v) {
    const p = new URLSearchParams(params);
    v ? p.set(k, v) : p.delete(k);
    p.delete("page");
    setParams(p);
  }
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
          placeholder="Search city, area or keyword"
          value={val("city")}
          onChange={(e) => set("city", e.target.value)}
        />
        <span>{val("city") ? "Showing in " + val("city") : "Across India"}</span>
      </div>
      <div className="browse-layout">
        <aside className="filters">
          <div className="filter-title">
            <SlidersHorizontal size={18} /> Fine-tune{" "}
            <button onClick={() => setParams({})}>Reset</button>
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
                placeholder="Min ₹"
                value={val("minRent")}
                onChange={(e) => set("minRent", e.target.value)}
              />
              <input
                type="number"
                placeholder="Max ₹"
                value={val("maxRent")}
                onChange={(e) => set("maxRent", e.target.value)}
              />
            </div>
          </label>
        </aside>
        <div className="results">
          <div className="results-head">
            <span>{busy ? "Finding homes…" : `${data.total} homes you might love`}</span>
            <select value={val("sort")} onChange={(e) => set("sort", e.target.value)}>
              <option value="newest">Newest first</option>
              <option value="rentLowHigh">Rent: low to high</option>
              <option value="rentHighLow">Rent: high to low</option>
            </select>
          </div>
          {busy ? (
            <div className="cards">
              {[1, 2, 3].map((n) => (
                <div className="skeleton" key={n} />
              ))}
            </div>
          ) : data.items.length ? (
            <>
              <div className="cards">
                {data.items.map((item) => (
                  <ListingCard key={item._id} item={item} />
                ))}
              </div>
              {data.pages > 1 && (
                <div className="pagination">
                  <button
                    disabled={Number(val("page") || 1) <= 1}
                    onClick={() => set("page", String(Number(val("page") || 1) - 1))}
                  >
                    ← Previous
                  </button>
                  <span>
                    Page {val("page") || 1} of {data.pages}
                  </span>
                  <button
                    disabled={Number(val("page") || 1) >= data.pages}
                    onClick={() => set("page", String(Number(val("page") || 1) + 1))}
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
