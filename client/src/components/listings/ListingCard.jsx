import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, MapPin } from "lucide-react";
import { useAuth } from "@/context/AuthContext.jsx";
import { useSaved } from "@/hooks/useSaved.js";
import { imgFallback } from "@/utils/constants.js";
function ListingCard({ item, saved = false, onSavedChange }) {
  const { user, notify } = useAuth();
  const { saveListing, removeSavedListing } = useSaved();
  const [isSaved, setIsSaved] = useState(saved);
  async function save(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return notify("Sign in as a seeker to save homes");
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
    } catch (e) {
      notify(e.response?.data?.message || "Could not save this home");
    }
  }
  return (
    <article className="listing-card">
      <div className="card-image">
        <Link to={`/listings/${item._id}`} aria-label={item.title}>
          <img
            loading="lazy"
            src={item.images?.[0]?.url || imgFallback}
            onError={(e) => (e.currentTarget.src = imgFallback)}
          />
        </Link>
        <span className="type-pill">{item.propertyType}</span>
        <button
          className={`heart${isSaved ? " is-saved" : ""}`}
          aria-label={`${isSaved ? "Unsave" : "Save"} ${item.title}`}
          aria-pressed={isSaved}
          onClick={save}
        >
          <Heart size={18} fill={isSaved ? "currentColor" : "none"} />
        </button>
      </div>
      <Link to={`/listings/${item._id}`} className="card-content">
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
