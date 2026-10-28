import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext.jsx";
import { dashboardService } from "@/services/dashboardService.js";
import { listingService } from "@/services/listingService.js";
import { enquiryService } from "@/services/enquiryService.js";
import Empty from "@/components/common/EmptyState.jsx";
import ListingForm from "@/components/listings/ListingForm.jsx";
import {
  DashboardHeader,
  DashboardSectionTitle,
  DeleteListingDialog,
  formatRent,
} from "@/pages/Dashboard.jsx";
import { imgFallback } from "@/utils/constants.js";
import ConfirmDialog from "@/components/common/ConfirmDialog.jsx";

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

export default function OwnerDashboard() {
  const { user, notify } = useAuth();
  const [items, setItems] = useState([]);
  const [received, setReceived] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [availabilityBusyId, setAvailabilityBusyId] = useState(null);
  const [availabilityTarget, setAvailabilityTarget] = useState(null);
  const [statusBusyId, setStatusBusyId] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError("");
    Promise.all([
      listingService.mine(),
      dashboardService.get("/enquiries/received"),
    ])
      .then(([listings, enquiries]) => {
        if (!active) return;
        setItems(listings);
        setReceived(enquiries.data.data || []);
      })
      .catch(() => {
        if (active) {
          setLoadError("We couldn't load your listings and enquiries. Check your connection and try again.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [retryCount]);

  async function create(formData) {
    try {
      const response = await listingService.create(formData);
      setItems((current) => [response.data.data, ...current]);
      setShowForm(false);
      notify("Your home is live!");
    } catch (error) {
      notify(error.response?.data?.message || "Could not create listing");
    }
  }

  async function updateListing(formData) {
    try {
      const response = await listingService.update(editing._id, formData);
      const updated = response.data.data;
      setItems((current) => current.map((item) => item._id === updated._id ? updated : item));
      setEditing(null);
      notify("Listing updated");
    } catch (error) {
      notify(error.response?.data?.message || "Could not update listing");
    }
  }

  async function confirmDelete() {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await listingService.remove(deleteTarget._id);
      setItems((current) => current.filter((item) => item._id !== deleteTarget._id));
      setDeleteTarget(null);
      notify("Listing deleted");
    } catch (error) {
      notify(error.response?.data?.message || "Could not delete listing");
    } finally {
      setDeleting(false);
    }
  }

  async function toggleAvailability(item, confirmedUnavailable = false) {
    if (availabilityBusyId) return;

    // Hiding a listing affects public search, so ask before changing it.
    if (item.isAvailable && !confirmedUnavailable) {
      setAvailabilityTarget(item);
      return;
    }

    const nextAvailability = confirmedUnavailable ? false : !item.isAvailable;
    const formData = new FormData();
    formData.set("isAvailable", String(nextAvailability));
    setAvailabilityBusyId(item._id);
    try {
      await listingService.update(item._id, formData);
      setItems((current) => current.map((entry) =>
        entry._id === item._id ? { ...entry, isAvailable: nextAvailability } : entry,
      ));
      if (!nextAvailability) setAvailabilityTarget(null);
      notify(nextAvailability ? "Listing marked available" : "Listing marked unavailable");
    } catch (error) {
      notify(error.response?.data?.message || "Could not update listing availability");
    } finally {
      setAvailabilityBusyId(null);
    }
  }

  async function updateStatus(enquiryId, nextStatus) {
    if (statusBusyId) return;
    setStatusBusyId(enquiryId);
    try {
      await enquiryService.updateStatus(enquiryId, nextStatus);
      setReceived((current) => current.map((enquiry) =>
        enquiry._id === enquiryId ? { ...enquiry, status: nextStatus } : enquiry,
      ));
      notify("Enquiry status updated");
    } catch (error) {
      notify(error.response?.data?.message || "Could not update enquiry status");
    } finally {
      setStatusBusyId(null);
    }
  }

  return (
    <main className="wrap page dashboard">
      <DashboardHeader
        user={user}
        description="Your spaces and the people looking for them."
        action={
          <button className="button" disabled={loading || Boolean(loadError) || showForm || Boolean(editing)} onClick={() => setShowForm(true)}>
            <Plus size={18} /> Add a listing
          </button>
        }
      />
      {loading ? (
        <div className="dashboard-async-state" role="status" aria-live="polite">
          <div className="skeleton dashboard-row-skeleton" />
          <div className="skeleton dashboard-row-skeleton" />
          <p>Loading your listings and enquiriesâ€¦</p>
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
          <span className="dashboard-metric-label">Your listings</span>
          <strong>{items.length}</strong>
          <small>All your properties</small>
        </div>
        <div className="dashboard-metric">
          <span className="dashboard-metric-label">Available</span>
          <strong>{items.filter((item) => item.isAvailable).length}</strong>
          <small>Visible in home search</small>
        </div>
        <div className="dashboard-metric">
          <span className="dashboard-metric-label">New enquiries</span>
          <strong>{received.filter((enquiry) => enquiry.status === "new").length}</strong>
          <small>Waiting for your response</small>
        </div>
      </div>
      {showForm && <ListingForm onSubmit={create} onCancel={() => setShowForm(false)} />}
      {editing && (
        <ListingForm
          key={editing._id}
          initial={editing}
          onSubmit={updateListing}
          onCancel={() => setEditing(null)}
        />
      )}

      <DashboardSectionTitle count={items.length}>Your listings</DashboardSectionTitle>
      {items.length ? (
        <div className="dash-list">
          {items.map((item) => (
            <div className="dash-row owner-listing-row" key={item._id}>
              <img
                src={item.images?.[0]?.url || imgFallback}
                alt={`Photo of ${item.title}`}
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = imgFallback;
                }}
              />
              <div>
                <b>{item.title}</b>
                <small>{item.locality}, {item.city} · {formatRent(item.rent)}/mo</small>
              </div>
              <Link
                className="dashboard-preview-link"
                to={`/listings/${item._id}`}
                target="_blank"
                rel="noreferrer"
                aria-label={`Preview listing: ${item.title}`}
              >
                Preview
              </Link>
              <span className={item.isAvailable ? "status" : "status off"}>
                {item.isAvailable ? "Available" : "Unavailable"}
              </span>
              <button
                className="icon-action"
                aria-label={`Edit listing: ${item.title}`}
                disabled={showForm || Boolean(editing)}
                onClick={() => { setShowForm(false); setEditing(item); }}
              >
                <Pencil size={15} /> Edit
              </button>
              <button
                className="icon-action"
                disabled={showForm || Boolean(editing) || availabilityBusyId === item._id}
                onClick={() => toggleAvailability(item)}
              >
                {availabilityBusyId === item._id ? "Saving…" : item.isAvailable ? "Mark unavailable" : "Mark available"}
              </button>
              <button
                className="icon-action danger"
                aria-label={`Delete listing: ${item.title}`}
                disabled={showForm || Boolean(editing)}
                onClick={() => setDeleteTarget(item)}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <Empty
          title="Your first listing starts here"
          text="Add your space and help someone feel at home in a new city."
        />
      )}

      <DashboardSectionTitle count={received.length}>Enquiries</DashboardSectionTitle>
      {received.length ? (
        <div className="enquiries">
          {received.map((enquiry) => (
            <article className="owner-enquiry-card" key={enquiry._id}>
              <div className="owner-enquiry-main">
                <div className="owner-enquiry-heading">
                  <b>{enquiry.seeker?.name || "Seeker"}</b>
                  <span className={`enquiry-status-pill status-${enquiry.status}`}>{enquiry.status}</span>
                </div>
                <small>
                  about {enquiry.listing?.title || "a listing"}
                  {enquiry.seeker?.email ? ` · ${enquiry.seeker.email}` : ""}
                  {enquiry.seeker?.phone ? ` · ${enquiry.seeker.phone}` : ""}
                </small>
                <p>{enquiry.message}</p>
                {enquiry.createdAt && (
                  <small className="dashboard-enquiry-date">
                    Received {formatDashboardDate(enquiry.createdAt)}
                  </small>
                )}
              </div>
              <label className="owner-enquiry-status">
                <span>Update status</span>
                <select
                aria-label={`Status for enquiry from ${enquiry.seeker?.name || "seeker"}`}
                value={enquiry.status}
                disabled={statusBusyId === enquiry._id}
                onChange={(event) => updateStatus(enquiry._id, event.target.value)}
              >
                <option value="new">new</option>
                <option value="contacted">contacted</option>
                <option value="closed">closed</option>
                </select>
              </label>
            </article>
          ))}
        </div>
      ) : (
        <p className="muted">No messages yet. They’ll appear here when someone reaches out.</p>
      )}
      <ConfirmDialog
        open={Boolean(availabilityTarget)}
        title="Mark this listing unavailable?"
        description={availabilityTarget ? `â€œ${availabilityTarget.title}â€ will be hidden from public search. You can mark it available again from your dashboard.` : ""}
        confirmLabel="Mark unavailable"
        busyLabel="Updatingâ€¦"
        busy={Boolean(availabilityTarget && availabilityBusyId === availabilityTarget._id)}
        icon={EyeOff}
        onCancel={() => setAvailabilityTarget(null)}
        onConfirm={() => {
          if (availabilityTarget) void toggleAvailability(availabilityTarget, true);
        }}
      />
      <DeleteListingDialog
        listing={deleteTarget}
        busy={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
        </>
      )}
    </main>
  );
}
