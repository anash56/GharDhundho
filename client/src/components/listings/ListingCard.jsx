import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Heart, LoaderCircle, MapPin } from "lucide-react";
import { useAuth } from "@/context/AuthContext.jsx";
import { useSaved } from "@/hooks/useSaved.js";
import { imgFallback } from "@/utils/constants.js";

function ListingCard({ item, saved = false, onSavedChange }) {
  const { user, notify } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const detailState = {
    from: location.pathname === "/listings"
      ? `${location.pathname}${location.search}`
      : "/listings",
  };
  const { saveListing, removeSavedListing } = useSaved();
  const [isSaved, setIsSaved] = useState(saved);
  const [saving, setSaving] = useState(false);
  const saveLock = useRef(false);

  useEffect(() => {
    setIsSaved(saved);
  }, [saved]);

  async function save(event) {
    event.preventDefault();
    event.stopPropagation();
    // UX Phase 16: keep guests on their current browse context after login.
    if (!user) {
      navigate("/login", {
        state: { from: `${location.pathname}${location.search}` || "/" },
      });
      return;
    }
    if (user.role !== "seeker") return notify("Only seeker accounts can save homes");
    if (saveLock.current) return;

    saveLock.current = true;
    setSaving(true);
    try {
      if (isSaved) {
        await removeSavedListing(item._id);
        setIsSaved(false);
        onSavedChange?.(false);
        notify("Removed from your saved homes");
      } else {
        await saveListing(item._id);
        setIsSaved(true);
        onSavedChange?.(true);
        notify("Saved to your list");
      }
    } catch (error) {
      notify(error.response?.data?.message || "Could not update saved homes. Please try again.");
    } finally {
      saveLock.current = false;
      setSaving(false);
    }
  }

  return (
    <article className="listing-card">
      <div className="card-image">
        <Link to={`/listings/${item._id}`} state={detailState} aria-label={item.title}>
          <img
            loading="lazy"
            src={item.images?.[0]?.url || imgFallback}
            alt={`Photo of ${item.title}`}
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = imgFallback;
            }}
          />
        </Link>
        <span className="type-pill">{item.propertyType}</span>
        <button
          type="button"
          className={`heart${isSaved ? " is-saved" : ""}${saving ? " is-saving" : ""}`}
          aria-label={saving
            ? isSaved ? `Removing ${item.title} from saved homes` : `Saving ${item.title}`
            : `${isSaved ? "Unsave" : "Save"} ${item.title}`}
          aria-pressed={isSaved}
          aria-busy={saving}
          disabled={saving}
          onClick={save}
        >
          {saving ? (
            <LoaderCircle size={18} className="save-spinner" aria-hidden="true" />
          ) : (
            <Heart size={18} fill={isSaved ? "currentColor" : "none"} aria-hidden="true" />
          )}
        </button>
      </div>
      <Link to={`/listings/${item._id}`} state={detailState} className="card-content">
        <div className="location">
          <MapPin size={14} />
          {item.locality}, {item.city}
        </div>
        <h3>{item.title}</h3>
        <div className="card-bottom">
          <span>
            <b>₹{Number(item.rent).toLocaleString("en-IN")}</b> / month
          </span>
          <span>{item.furnishing}</span>
        </div>
      </Link>
    </article>
  );
}

export default ListingCard;
