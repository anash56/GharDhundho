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
  const { id } = useParams(),
    navigate = useNavigate(),
    [item, setItem] = useState(null),
    [imageIndex, setImageIndex] = useState(0),
    [isSaved, setIsSaved] = useState(false),
    { user, notify } = useAuth();
  useEffect(() => {
    setImageIndex(0);
    listingService
      .get(id)
      .then((r) => setItem(r.data.data))
      .catch(() => setItem(false));
  }, [id]);
  const images = item?.images?.length ? item.images : [{ url: imgFallback }];
  const moveImage = useCallback(
    (direction) => {
      setImageIndex((index) => (index + direction + images.length) % images.length);
    },
    [images.length],
  );
  useEffect(() => {
    if (user?.role !== "seeker") return;
    savedService
      .list()
      .then(({ data }) =>
        setIsSaved(data.data.some((entry) => entry.listing?._id === id)),
      )
      .catch(() => {});
  }, [id, user]);
  useEffect(() => {
    function onKeyDown(event) {
      if (event.target.matches("input, textarea, select, [contenteditable='true']"))
        return;
      if (event.key === "ArrowRight") moveImage(1);
      if (event.key === "ArrowLeft") moveImage(-1);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [moveImage]);
  if (item === null)
    return (
      <div className="wrap page">
        <div className="skeleton detail-skeleton" />
      </div>
    );
  if (!item)
    return (
      <Empty
        title="This home isn't available"
        text="It may have been taken off the market."
      />
    );
  async function enquire(e) {
    e.preventDefault();
    if (!user) return navigate("/login", { state: { from: `/listings/${id}` } });
    const message = new FormData(e.currentTarget).get("message");
    try {
      await enquiryService.create({ listingId: id, message });
      notify("Your enquiry has been sent!");
      e.currentTarget.reset();
    } catch (err) {
      notify(err.response?.data?.message || "Could not send enquiry");
    }
  }
  async function save() {
    if (!user) return notify("Sign in as a seeker to save homes");
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
    } catch (e) {
      notify(e.response?.data?.message || "Could not save");
    }
  }
  return (
    <main className="wrap page detail-page">
      <div className="detail-image">
        <img src={images[imageIndex]?.url || imgFallback} alt={item.title} />
        {images.length > 1 && (
          <>
            <button
              className="gallery-arrow gallery-previous"
              aria-label="Previous image"
              onClick={() => moveImage(-1)}
            >
              ‹
            </button>
            <button
              className="gallery-arrow gallery-next"
              aria-label="Next image"
              onClick={() => moveImage(1)}
            >
              ›
            </button>
            <div className="gallery-thumbnails" aria-label="Listing images">
              {images.map((image, index) => (
                <button
                  key={`${image.url}-${index}`}
                  className={imageIndex === index ? "active" : ""}
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
          className="button button-light"
          aria-label={isSaved ? "Unsave home" : "Save home"}
          aria-pressed={isSaved}
          onClick={save}
        >
          <Heart size={17} fill={isSaved ? "currentColor" : "none"} />{" "}
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
          <p className="detail-description">{item.description}</p>
          <div className="detail-facts">
            <Fact label="HOME TYPE" value={item.propertyType} />
            <Fact label="FURNISHING" value={item.furnishing} />
            <Fact label="PREFERENCE" value={item.availableFor} />
          </div>
          <h2>Little things included</h2>
          <div className="amenities">
            {(item.amenities || []).map((a) => (
              <span key={a}>✓ {a}</span>
            ))}
          </div>
          <div className="owner-card">
            <div className="avatar">{item.owner.name[0]}</div>
            <div>
              <b>{item.owner.name}</b>
              <small>
                Home owner{" "}
                {item.owner.isVerified && (
                  <span className="verified">
                    <CheckCircle2 size={13} /> Verified
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
          <p>Deposit: ₹{Number(item.deposit || 0).toLocaleString("en-IN")}</p>
          <form onSubmit={enquire}>
            <label htmlFor="message">Say hello to the owner</label>
            <textarea
              id="message"
              name="message"
              required
              minLength="5"
              placeholder="Hi! I’m interested in this place…"
            />
            <button className="button" type="submit">
              <Send size={16} /> Send enquiry
            </button>
          </form>
          <small className="privacy-note">Your message goes directly to the owner.</small>
        </aside>
      </div>
    </main>
  );
}

export default Detail;
