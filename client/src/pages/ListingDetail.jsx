
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Heart, MapPin, Send, CheckCircle2 } from "lucide-react";
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
  const [item, setItem] = useState(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
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

  useEffect(() => {
    function onKeyDown(event) {
      if (
        event.target.matches(
          "input, textarea, select, [contenteditable='true']",
        )
      ) {
        return;
      }

      if (event.key === "ArrowRight") moveImage(1);
      if (event.key === "ArrowLeft") moveImage(-1);
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [moveImage]);

  async function enquire(event) {
    event.preventDefault();

    const form = event.currentTarget;

    if (!user) {
      navigate("/login", {
        state: { from: `/listings/${id}` },
      });
      return;
    }

    if (user.role !== "seeker") {
      notify("Only seeker accounts can send enquiries to owners.");
      return;
    }

    const message = new FormData(form).get("message");

    try {
      await enquiryService.create({
        listingId: id,
        message,
      });

      notify("Your enquiry has been sent!");
      form.reset();
    } catch (error) {
      notify(
        error.response?.data?.message ||
        "Could not send enquiry",
      );
    }
  }

  async function save() {
    if (user?.role !== "seeker") {
      notify(
        user
          ? "Only seeker accounts can save homes."
          : "Sign in as a seeker to save homes.",
      );
      return;
    }

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
      notify(
        error.response?.data?.message || "Could not save",
      );
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
      <div className="detail-image">
        <img
          src={images[imageIndex]?.url || imgFallback}
          alt={item.title}
          onError={(event) => {
            event.currentTarget.src = imgFallback;
          }}
        />

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
                  <img src={image.url} alt="" />
                </button>
              ))}
            </div>
          </>
        )}

        <button
          type="button"
          className="button button-light"
          aria-label={isSaved ? "Unsave home" : "Save home"}
          aria-pressed={isSaved}
          onClick={save}
        >
          <Heart
            size={17}
            fill={isSaved ? "currentColor" : "none"}
          />
          {isSaved ? "Saved" : "Save home"}
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

          <div className="amenities">
            {(item.amenities || []).map((amenity) => (
              <span key={amenity}>✓ {amenity}</span>
            ))}
          </div>

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

          {user && user.role !== "seeker" ? (
            <div className="muted" role="status">
              <b>Contacting the owner</b>
              <p>
                Only seeker accounts can send enquiries.
                Sign in with a seeker account to contact
                this owner.
              </p>
            </div>
          ) : (
            <form onSubmit={enquire}>
              <label htmlFor="message">
                Say hello to the owner
              </label>

              <textarea
                id="message"
                name="message"
                required
                minLength={5}
                maxLength={2000}
                placeholder="Hi! I'm interested in this place..."
              />

              <button type="submit" className="button">
                <Send size={16} />
                Send enquiry
              </button>
            </form>
          )}

          <small className="privacy-note">
            Your message goes directly to the owner.
          </small>
        </aside>
      </div>
    </main>
  );
}

export default Detail;
