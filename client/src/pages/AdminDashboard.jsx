import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext.jsx";
import { dashboardService } from "@/services/dashboardService.js";
import ConfirmDialog from "@/components/common/ConfirmDialog.jsx";
import { imgFallback } from "@/utils/constants.js";
import { formatRent } from "@/pages/Dashboard.jsx";

const PAGE_SIZE = 10;

export default function AdminDashboard() {
  const { user, notify } = useAuth();
  const [overview, setOverview] = useState(null);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [moderationTarget, setModerationTarget] = useState(null);
  const [moderating, setModerating] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError("");

    Promise.all([
      dashboardService.get("/admin/overview"),
      dashboardService.get("/admin/listings", {
        params: { page, limit: PAGE_SIZE, status: filter, search: search.trim() },
      }),
    ])
      .then(([overviewResponse, listingsResponse]) => {
        if (!active) return;
        setOverview(overviewResponse.data.data);
        const result = listingsResponse.data.data;
        setItems(result.items || []);
        setPages(Math.max(1, result.pages || 1));
      })
      .catch((error) => {
        if (!active) return;
        setLoadError(
          error.response?.data?.message ||
            "We couldn't load the admin dashboard. Check your connection and try again.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page, filter, search, retryCount]);

  async function confirmModeration() {
    if (!moderationTarget || moderating) return;
    const nextHiddenState = !moderationTarget.isHiddenByAdmin;
    setModerating(true);
    try {
      await dashboardService.patch(
        `/admin/listings/${moderationTarget._id}/moderation`,
        {
          isHiddenByAdmin: nextHiddenState,
          reason: nextHiddenState ? "Hidden by administration for further review." : "",
        },
      );
      notify(nextHiddenState ? "Listing hidden from public search" : "Listing restored to public search");
      setModerationTarget(null);
      setRetryCount((count) => count + 1);
    } catch (error) {
      notify(error.response?.data?.message || "Could not update listing moderation");
    } finally {
      setModerating(false);
    }
  }

  const metrics = overview
    ? [
        { label: "Total accounts", value: overview.users.total, detail: `${overview.users.owners} owners · ${overview.users.seekers} seekers` },
        { label: "Total listings", value: overview.listings.total, detail: `${overview.listings.available} available` },
        { label: "Hidden listings", value: overview.listings.hidden, detail: "Removed from public search" },
        { label: "Enquiries", value: overview.enquiries.total, detail: `${overview.enquiries.new} awaiting owner response` },
      ]
    : [];

  return (
    <main className="wrap page dashboard admin-dashboard">
      <div className="dash-head admin-dashboard-heading">
        <div>
          <span className="eyebrow"><ShieldCheck size={14} aria-hidden="true" /> ADMINISTRATION</span>
          <h1>Welcome back, {user?.name?.split(" ")[0] || "Admin"}.</h1>
          <p>Review listings and help keep GharDhundho trustworthy.</p>
        </div>
      </div>

      {loading && !overview ? (
        <div className="dashboard-async-state" role="status" aria-live="polite">
          <div className="skeleton dashboard-row-skeleton" />
          <div className="skeleton dashboard-row-skeleton" />
          <p>Loading admin overview…</p>
        </div>
      ) : loadError && !overview ? (
        <div className="dashboard-async-state dashboard-load-error" role="alert">
          <p>{loadError}</p>
          <button className="button button-small" type="button" onClick={() => setRetryCount((count) => count + 1)}>
            Try again
          </button>
        </div>
      ) : (
        <>
          <div className="dashboard-metrics admin-metrics" aria-label="Platform summary">
            {metrics.map((metric) => (
              <div className="dashboard-metric" key={metric.label}>
                <span className="dashboard-metric-label">{metric.label}</span>
                <strong>{Number(metric.value || 0).toLocaleString("en-IN")}</strong>
                <small>{metric.detail}</small>
              </div>
            ))}
          </div>

          <section className="admin-review-section" aria-labelledby="admin-listings-title">
            <div className="admin-review-heading">
              <div>
                <span className="eyebrow">CONTENT REVIEW</span>
                <h2 id="admin-listings-title">Property listings</h2>
                <p>Hide suspicious or inappropriate listings without changing the owner's availability setting.</p>
              </div>
              <label className="admin-search-label">
                <span className="sr-only">Search listings</span>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search title, city or locality"
                />
              </label>
            </div>

            <div className="admin-listing-toolbar">
              <div className="admin-filter-tabs" role="group" aria-label="Filter listings">
                {[
                  { value: "all", label: "All listings" },
                  { value: "visible", label: "Visible" },
                  { value: "hidden", label: "Hidden" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={filter === option.value ? "admin-filter-active" : ""}
                    aria-pressed={filter === option.value}
                    onClick={() => {
                      setFilter(option.value);
                      setPage(1);
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {loading && <span className="muted" role="status">Refreshing…</span>}
            </div>

            {loadError ? (
              <div className="dashboard-async-state dashboard-load-error" role="alert">
                <p>{loadError}</p>
                <button className="button button-small" type="button" onClick={() => setRetryCount((count) => count + 1)}>
                  Try again
                </button>
              </div>
            ) : items.length ? (
              <div className="admin-listing-list">
                {items.map((item) => (
                  <article className="admin-listing-card" key={item._id}>
                    <img
                      src={item.images?.[0]?.url || imgFallback}
                      alt={`Photo of ${item.title}`}
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = imgFallback;
                      }}
                    />
                    <div className="admin-listing-info">
                      <div className="admin-listing-title-row">
                        <h3>{item.title}</h3>
                        <span className={item.isHiddenByAdmin ? "enquiry-status-pill status-closed" : "enquiry-status-pill status-contacted"}>
                          {item.isHiddenByAdmin ? "Hidden by admin" : "Public"}
                        </span>
                      </div>
                      <p>{item.locality}, {item.city} · {formatRent(item.rent)}/mo</p>
                      <small>Owner: {item.owner?.name || "Unknown"}{item.owner?.email ? ` · ${item.owner.email}` : ""}</small>
                      <small>Owner availability: {item.isAvailable ? "Available" : "Unavailable"}</small>
                      {item.isHiddenByAdmin && item.adminModerationNote && (
                        <small className="admin-moderation-note">Reason: {item.adminModerationNote}</small>
                      )}
                    </div>
                    <div className="admin-listing-actions">
                      <button
                        className={item.isHiddenByAdmin ? "button button-small" : "icon-action danger"}
                        type="button"
                        disabled={loading || moderating}
                        onClick={() => setModerationTarget(item)}
                      >
                        {item.isHiddenByAdmin ? <><Eye size={15} /> Restore</> : <><EyeOff size={15} /> Hide</>}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="admin-empty-state">
                <ShieldCheck size={24} aria-hidden="true" />
                <h3>No listings found</h3>
                <p>Try another filter or search term.</p>
              </div>
            )}

            <div className="admin-pagination" aria-label="Listing pages">
              <span>Page {page} of {pages}</span>
              <div>
                <button className="icon-action" type="button" aria-label="Previous page" disabled={page <= 1 || loading} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                  <ChevronLeft size={17} /> Previous
                </button>
                <button className="icon-action" type="button" aria-label="Next page" disabled={page >= pages || loading} onClick={() => setPage((current) => Math.min(pages, current + 1))}>
                  Next <ChevronRight size={17} />
                </button>
              </div>
            </div>
          </section>
        </>
      )}

      <ConfirmDialog
        open={Boolean(moderationTarget)}
        title={moderationTarget?.isHiddenByAdmin ? "Restore this listing?" : "Hide this listing from search?"}
        description={moderationTarget?.isHiddenByAdmin
          ? `“${moderationTarget.title}” will become visible in public search again. The owner's availability setting will remain unchanged.`
          : `“${moderationTarget?.title || "This listing"}” will be hidden from public search. The owner can still see it in their dashboard. This action does not delete the listing or its enquiries.`}
        confirmLabel={moderationTarget?.isHiddenByAdmin ? "Restore listing" : "Hide listing"}
        busyLabel="Updating…"
        busy={moderating}
        onCancel={() => setModerationTarget(null)}
        onConfirm={confirmModeration}
      />
    </main>
  );
}
