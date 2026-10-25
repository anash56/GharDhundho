import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
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

export default function OwnerDashboard() {
  const { user, notify } = useAuth();
  const [items, setItems] = useState([]);
  const [received, setReceived] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [availabilityBusyId, setAvailabilityBusyId] = useState(null);
  const [statusBusyId, setStatusBusyId] = useState(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      listingService.mine(),
      dashboardService.get("/enquiries/received"),
    ])
      .then(([listings, enquiries]) => {
        if (!active) return;
        setItems(listings);
        setReceived(enquiries.data.data || []);
      })
      .catch((error) => {
        if (active) {
          notify(error.response?.data?.message || "Could not load your dashboard. Please retry.");
        }
      });
    return () => {
      active = false;
    };
  }, [notify]);

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

  async function toggleAvailability(item) {
    if (availabilityBusyId) return;
    const nextAvailability = !item.isAvailable;
    const formData = new FormData();
    formData.set("isAvailable", String(nextAvailability));
    setAvailabilityBusyId(item._id);
    try {
      await listingService.update(item._id, formData);
      setItems((current) => current.map((entry) =>
        entry._id === item._id ? { ...entry, isAvailable: nextAvailability } : entry,
      ));
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
          <button className="button" onClick={() => { setEditing(null); setShowForm((open) => !open); }}>
            <Plus size={18} /> Add a listing
          </button>
        }
      />
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
            <div className="dash-row" key={item._id}>
              <img src={item.images?.[0]?.url || imgFallback} alt={`Photo of ${item.title}`} />
              <div>
                <b>{item.title}</b>
                <small>{item.locality}, {item.city} · {formatRent(item.rent)}/mo</small>
              </div>
              <span className={item.isAvailable ? "status" : "status off"}>
                {item.isAvailable ? "Available" : "Unavailable"}
              </span>
              <button
                className="icon-action"
                aria-label={`Edit listing: ${item.title}`}
                onClick={() => { setShowForm(false); setEditing(item); }}
              >
                <Pencil size={15} /> Edit
              </button>
              <button
                className="icon-action"
                disabled={availabilityBusyId === item._id}
                onClick={() => toggleAvailability(item)}
              >
                {availabilityBusyId === item._id ? "Saving…" : item.isAvailable ? "Mark unavailable" : "Mark available"}
              </button>
              <button
                className="icon-action danger"
                aria-label={`Delete listing: ${item.title}`}
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
            <article key={enquiry._id}>
              <div>
                <b>{enquiry.seeker?.name || "Seeker"}</b>
                <small>
                  about {enquiry.listing?.title || "a listing"}
                  {enquiry.seeker?.email ? ` · ${enquiry.seeker.email}` : ""}
                  {enquiry.seeker?.phone ? ` · ${enquiry.seeker.phone}` : ""}
                </small>
                <p>{enquiry.message}</p>
              </div>
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
            </article>
          ))}
        </div>
      ) : (
        <p className="muted">No messages yet. They’ll appear here when someone reaches out.</p>
      )}
      <DeleteListingDialog
        listing={deleteTarget}
        busy={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </main>
  );
}
