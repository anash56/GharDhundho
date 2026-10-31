
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Heart, MapPin, Send, CheckCircle2, Share2 } from "lucide-react";
import { listingService } from "@/services/listingService.js";
import { enquiryService } from "@/services/enquiryService.js";
import { savedService } from "@/services/savedService.js";
import { useAuth } from "@/context/AuthContext.jsx";
import { imgFallback } from "@/utils/constants.js";
import Fact from "@/components/listings/Fact.jsx";
import Empty from "@/components/common/EmptyState.jsx";

function Detail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const requestedReturnTo = location.state?.from;
  const backToHomes =
    typeof requestedReturnTo === "string" &&
    requestedReturnTo.startsWith("/listings") &&
    !requestedReturnTo.startsWith("//")
      ? requestedReturnTo
      : "/listings";
  const [item, setItem] = useState(null);
  const [imageIndex, setImageIndex] = useState(0);
  const touchStartRef = useRef(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEnquiring, setIsEnquiring] = useState(false);
  const [enquirySent, setEnquirySent] = useState(false);
  const [message, setMessage] = useState(() =>
    typeof location.state?.enquiryDraft === "string"
      ? location.state.enquiryDraft
      : "",
  );
  const { user, notify } = useAuth();

  useEffect(() => {
    let active = true;

    setItem(null);
    setImageIndex(0);

    listingService
      .get(id)
      .then((response) => {
        if (active) {
          setItem(response.data.data);
        }
      })
      .catch(() => {
        if (active) {
          setItem(false);
        }
      });

    return () => {
      active = false;
    };
  }, [id]);

  const images = item?.images?.length
    ? item.images
    : [{ url: imgFallback }];

  const moveImage = useCallback(
    (direction) => {
      setImageIndex(
        (index) => (index + direction + images.length) % images.length,
      );
    },
    [images.length],
  );

  useEffect(() => {
    let active = true;

    if (user?.role !== "seeker") {
      setIsSaved(false);
      return () => {
        active = false;
      };
    }

    savedService
      .list()
      .then(({ data }) => {
        if (active) {
          setIsSaved(
            data.data.some(
              (entry) => entry.listing?._id === id,
            ),
          );
        }
      })
      .catch(() => { });

    return () => {
      active = false;
    };
  }, [id, user]);

  function handleGalleryKeyDown(event) {
    if (
      images.length <= 1 ||
      event.defaultPrevented ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey
    ) {
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      moveImage(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveImage(-1);
    }
  }

  function handleGalleryTouchStart(event) {
    if (images.length <= 1 || event.touches.length !== 1) {
      touchStartRef.current = null;
      return;
    }

    const touch = event.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }

  function handleGalleryTouchEnd(event) {
    const start = touchStartRef.current;
    touchStartRef.current = null;

    if (!start || images.length <= 1 || event.changedTouches.length !== 1) {
      return;
    }

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    const minimumSwipeDistance = 50;

    // Ignore vertical scrolling and small finger movements.
    if (
      Math.abs(deltaX) < minimumSwipeDistance ||
      Math.abs(deltaX) <= Math.abs(deltaY) * 1.2
    ) {
      return;
    }

    moveImage(deltaX < 0 ? 1 : -1);
  }
  async function enquire(event) {
    event.preventDefault();
    if (isEnquiring) return;

    if (!user) {
      navigate("/login", {
        state: {
          from: `/listings/${id}`,
          returnTo: backToHomes,
          enquiryDraft: message,
        },
      });
      return;
    }

    if (user.role !== "seeker") {
      notify("Only seeker accounts can send enquiries to owners.");
      return;
    }

    if (item?.isAvailable === false) {
      notify("This home is not currently available.");
      return;
    }

    setIsEnquiring(true);
    try {
      await enquiryService.create({ listingId: id, message });
      setMessage("");
      setEnquirySent(true);
      notify("Your enquiry has been sent!");
    } catch (error) {
      notify(
        error.response?.data?.message ||
          "Could not send enquiry. Your message is still here; please try again.",
      );
    } finally {
      setIsEnquiring(false);
    }
  }

  async function save() {
    if (isSaving) return;

    if (!user) {
      navigate("/login", {
        state: { from: `/listings/${id}`, returnTo: backToHomes },
      });
      return;
    }

    if (user.role !== "seeker") {
      notify("Only seeker accounts can save homes.");
      return;
    }

    setIsSaving(true);
    try {
      if (isSaved) {
        await savedService.remove(id);
        setIsSaved(false);
        notify("Removed from your saved homes");
      } else {
        await savedService.save(id);
        setIsSaved(true);
        notify("Saved to your list");
      }
    } catch (error) {
      notify(error.response?.data?.message || "Could not update saved homes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  async function shareHome() {
    const shareData = {
      title: item.title,
      text: `${item.title} — ${item.locality}, ${item.city}. ₹${Number(item.rent).toLocaleString("en-IN")}/month`,
      url: window.location.href,
    };

    if (typeof navigator.share === "function") {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        if (error?.name === "AbortError") return;
      }
    }

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API is not available.");
      }
      await navigator.clipboard.writeText(shareData.url);
      notify("Home link copied. Share it with someone looking for a place.");
    } catch {
      notify("Couldn't copy the link. You can share this page's URL from your browser.");
    }
  }
  if (item === null) {
    return (
      <div className="wrap page">
        <div className="skeleton detail-skeleton" />
      </div>
    );
  }

  if (!item) {
    return (
      <Empty
        title="This home isn't available"
        text="It may have been taken off the market."
      />
    );
  }

  return (
    <main className="wrap page detail-page">
      <div className="detail-top-actions">
        <Link to={backToHomes} className="detail-back">
          <ArrowLeft size={16} aria-hidden="true" />
          Back to homes
        </Link>
        <button type="button" className="detail-share" onClick={shareHome}>
          <Share2 size={16} aria-hidden="true" />
          Share home
        </button>
      </div>
      <div
        className="detail-image"
        role="group"
        aria-label={images.length > 1
          ? "Property photo gallery. Use the left and right arrow keys to change images."
          : "Property photo"}
        tabIndex={images.length > 1 ? 0 : undefined}
        onKeyDown={handleGalleryKeyDown}
        onTouchStart={handleGalleryTouchStart}
        onTouchEnd={handleGalleryTouchEnd}
      >
        <img
          src={images[imageIndex]?.url || imgFallback}
          alt={item.title}
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = imgFallback;
          }}
        />

        {images.length > 1 && (
          <span className="detail-image-count" aria-live="polite">
            {imageIndex + 1} / {images.length}
          </span>
        )}

        {images.length > 1 && (
          <>
            <button
              type="button"
              className="gallery-arrow gallery-previous"
              aria-label="Previous image"
              onClick={() => moveImage(-1)}
            >
              ‹
            </button>

            <button
              type="button"
              className="gallery-arrow gallery-next"
              aria-label="Next image"
              onClick={() => moveImage(1)}
            >
              ›
            </button>

            <div
              className="gallery-thumbnails"
              aria-label="Listing images"
            >
              {images.map((image, index) => (
                <button
                  type="button"
                  key={`${image.url}-${index}`}
                  className={
                    imageIndex === index ? "active" : ""
                  }
                  aria-label={`Show image ${index + 1}`}
                  aria-pressed={imageIndex === index}
                  onClick={() => setImageIndex(index)}
                >
                  <img
                    src={image.url || imgFallback}
                    alt=""
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = imgFallback;
                    }}
                  />
                </button>
              ))}
            </div>
          </>
        )}

        <button
          type="button"
          className="button button-light"
          aria-label={isSaving ? "Updating saved home" : isSaved ? "Unsave home" : "Save home"}
          aria-pressed={isSaved}
          aria-busy={isSaving}
          disabled={isSaving}
          onClick={save}
        >
          <Heart
            size={17}
            fill={isSaved ? "currentColor" : "none"}
          />
          {isSaving ? "Updating…" : isSaved ? "Saved" : "Save home"}
        </button>
      </div>

      <div className="detail-grid">
        <article>
          <div className="location">
            <MapPin size={15} />
            {item.locality}, {item.city}
          </div>

          <h1>{item.title}</h1>

          <p className="detail-description">
            {item.description}
          </p>

          <div className="detail-facts">
            <Fact
              label="HOME TYPE"
              value={item.propertyType}
            />
            <Fact
              label="FURNISHING"
              value={item.furnishing}
            />
            <Fact
              label="PREFERENCE"
              value={item.availableFor}
            />
          </div>

          <h2>Little things included</h2>

          {item.amenities?.length ? (
            <div className="amenities">
              {item.amenities.map((amenity) => (
                <span key={amenity}>✓ {amenity}</span>
              ))}
            </div>
          ) : (
            <p className="amenities-empty">The owner hasn't added amenities yet.</p>
          )}

          <div className="owner-card">
            <div className="avatar">
              {item.owner?.name?.[0] || "O"}
            </div>

            <div>
              <b>{item.owner?.name || "Home owner"}</b>
              <small>
                Home owner{" "}
                {item.owner?.isVerified && (
                  <span className="verified">
                    <CheckCircle2 size={13} />
                    Verified
                  </span>
                )}
              </small>
            </div>
          </div>
        </article>

        <aside className="enquiry-card">
          <span className="eyebrow">YOUR NEXT STEP</span>

          <div className="price">
            ₹{Number(item.rent).toLocaleString("en-IN")}
            <small> / month</small>
          </div>

          <p>
            Deposit: ₹
            {Number(item.deposit || 0).toLocaleString("en-IN")}
          </p>

          {item.isAvailable === false ? (
            <div className="detail-unavailable" role="status">
              <b>This home isn't currently available.</b>
              <p>The owner has marked this listing unavailable, so enquiries are paused.</p>
            </div>
          ) : user && user.role !== "seeker" ? (
            <div className="muted" role="status">
              <b>Contacting the owner</b>
              <p>Only seeker accounts can send enquiries. Use a seeker account to contact this owner.</p>
            </div>
          ) : (
            <form onSubmit={enquire} aria-busy={isEnquiring}>
              <label htmlFor="message">Say hello to the owner</label>
              <textarea
                id="message"
                name="message"
                value={message}
                onChange={(event) => {
                  setMessage(event.target.value);
                  if (enquirySent) setEnquirySent(false);
                }}
                required
                minLength={5}
                maxLength={2000}
                aria-describedby="enquiry-help"
                placeholder="Hi! I'm interested in this place..."
              />
              <small className="enquiry-hint" id="enquiry-help">
                {user ? "Share a little about your move or ask a question." : "You'll sign in before the message is sent. We'll keep your message ready."}
                <span>{message.length}/2000</span>
              </small>
              {enquirySent && (
                <p className="enquiry-success" role="status" aria-live="polite">
                  Your enquiry was sent. The owner can now respond to you.
                </p>
              )}
              <button type="submit" className="button" disabled={isEnquiring}>
                <Send size={16} aria-hidden="true" />
                {isEnquiring ? "Sending enquiry..." : "Send enquiry"}
              </button>
            </form>
          )}

          <small className="privacy-note">
            Your message will appear in the property owner's dashboard.
          </small>
        </aside>
      </div>
    </main>
  );
}

export default Detail;
