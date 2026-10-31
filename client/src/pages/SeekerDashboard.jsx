import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, MapPin } from "lucide-react";
import { useAuth } from "@/context/AuthContext.jsx";
import { dashboardService } from "@/services/dashboardService.js";
import ListingCard from "@/components/listings/ListingCard.jsx";
import Empty from "@/components/common/EmptyState.jsx";
import {
  DashboardHeader,
  DashboardSectionTitle,
} from "@/pages/Dashboard.jsx";

function formatDashboardDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function SeekerDashboard() {
  const { user } = useAuth();
  const [saved, setSaved] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError("");
    Promise.all([
      dashboardService.get("/saved"),
      dashboardService.get("/enquiries/sent"),
    ])
      .then(([savedResponse, sentResponse]) => {
        if (!active) return;
        setSaved(savedResponse.data.data || []);
        setSent(sentResponse.data.data || []);
      })
      .catch(() => {
        if (active) {
          setLoadError("We couldn't load your saved homes and enquiries. Check your connection and try again.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [retryCount]);

  return (
    <main className="wrap page dashboard">
      <DashboardHeader
        user={user}
        description="Your saved places and conversations."
      />
      {loading ? (
        <div className="dashboard-async-state" role="status" aria-live="polite">
          <div className="skeleton dashboard-row-skeleton" />
          <div className="skeleton dashboard-row-skeleton" />
          <p>Loading your saved homes and enquiries…</p>
        </div>
      ) : loadError ? (
        <div className="dashboard-async-state dashboard-load-error" role="alert">
          <p>{loadError}</p>
          <button className="button button-small" type="button" onClick={() => setRetryCount((count) => count + 1)}>
            Try again
          </button>
        </div>
      ) : (
        <>
      <div className="dashboard-metrics" aria-label="Dashboard summary">
        <div className="dashboard-metric">
          <span className="dashboard-metric-label">Saved homes</span>
          <strong>{saved.filter((entry) => entry.listing).length}</strong>
          <small>Places worth revisiting</small>
        </div>
        <div className="dashboard-metric">
          <span className="dashboard-metric-label">Enquiries sent</span>
          <strong>{sent.length}</strong>
          <small>Your owner conversations</small>
        </div>
        <div className="dashboard-metric">
          <span className="dashboard-metric-label">Open conversations</span>
          <strong>{sent.filter((enquiry) => ["new", "contacted"].includes(enquiry.status)).length}</strong>
          <small>Not marked as closed</small>
        </div>
      </div>
      <DashboardSectionTitle count={saved.length}>Saved homes</DashboardSectionTitle>
      {saved.length ? (
        <div className="cards">
          {saved.map((entry) => entry.listing && (
            <ListingCard
              key={entry._id}
              item={entry.listing}
              saved
              onSavedChange={(isSaved) => {
                if (!isSaved) {
                  setSaved((current) => current.filter((savedEntry) => savedEntry._id !== entry._id));
                }
              }}
            />
          ))}
        </div>
      ) : (
        <Empty
          title="A blank slate, with possibilities"
          text="Save a place that feels right and it’ll show up here."
        />
      )}

      <DashboardSectionTitle count={sent.length}>Your enquiries</DashboardSectionTitle>
      {sent.length ? sent.map((enquiry) => {
        const listing = enquiry.listing;
        return (
          <article className="seeker-enquiry-card" key={enquiry._id}>
            <div className="seeker-enquiry-heading">
              <div>
                <h3>{listing?.title || "Listing no longer available"}</h3>
                {listing && (
                  <p className="seeker-enquiry-location">
                    <MapPin size={14} aria-hidden="true" />
                    {listing.locality}, {listing.city}
                  </p>
                )}
              </div>
              <span className={`enquiry-status-pill status-${enquiry.status}`}>{({ new: "New", contacted: "Contacted", closed: "Closed" })[enquiry.status] || enquiry.status}</span>
            </div>
            <p className="seeker-enquiry-message">{enquiry.message}</p>
            <div className="seeker-enquiry-footer">
              <div className="seeker-enquiry-facts">
                {listing?.rent !== undefined && listing?.rent !== null && (
                  <strong>₹{Number(listing.rent).toLocaleString("en-IN")} <small>/ month</small></strong>
                )}
                {enquiry.createdAt && <small>Sent {formatDashboardDate(enquiry.createdAt)}</small>}
              </div>
              {listing?._id ? (
                <Link className="button button-small" to={`/listings/${listing._id}`}>
                  View home <ArrowRight size={15} />
                </Link>
              ) : (
                <span className="seeker-enquiry-unavailable">This listing is no longer available.</span>
              )}
            </div>
          </article>
        );
      }) : (
        <Empty
          title="No enquiries yet"
          text="Send a message to an owner when a place catches your eye."
        />
      )}
        </>
      )}
    </main>
  );
}
