import { Trash2 } from "lucide-react";

/** Shared dashboard header used by the role-specific dashboard pages. */
export function DashboardHeader({ user, description, action }) {
  return (
    <div className="dash-head">
      <div>
        <span className="eyebrow">YOUR LITTLE CORNER</span>
        <h1>
          Hey {user.name.split(" ")[0]}
          <em>, welcome home.</em>
        </h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}

export function DashboardSectionTitle({ children, count }) {
  return (
    <h2 className="dash-section-title">
      {children} <span>{count}</span>
    </h2>
  );
}

/** Small accessible confirmation dialog; avoids the browser's blocking confirm(). */
export function DeleteListingDialog({ listing, busy = false, onCancel, onConfirm }) {
  if (!listing) return null;

  return (
    <div
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "grid",
        placeItems: "center",
        padding: 20,
        background: "rgba(15, 23, 42, 0.52)",
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-listing-title"
        aria-describedby="delete-listing-description"
        style={{
          width: "min(100%, 420px)",
          padding: 24,
          borderRadius: 18,
          background: "#fff",
          boxShadow: "0 24px 70px rgba(15, 23, 42, 0.28)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Trash2 size={20} aria-hidden="true" />
          <h2 id="delete-listing-title">Delete this listing?</h2>
        </div>
        <p id="delete-listing-description">
          “{listing.title}” will be removed, along with its enquiries and saved records. This
          action cannot be undone.
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 22 }}>
          <button className="text-button" type="button" disabled={busy} onClick={onCancel}>
            Cancel
          </button>
          <button className="button" type="button" disabled={busy} onClick={onConfirm}>
            {busy ? "Deleting…" : "Delete listing"}
          </button>
        </div>
      </section>
    </div>
  );
}

export function formatRent(rent) {
  return `₹${Number(rent).toLocaleString("en-IN")}`;
}
