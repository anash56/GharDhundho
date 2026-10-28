import { useEffect, useId, useMemo, useRef, useState } from "react";
import { X, ImagePlus, MapPin, IndianRupee, House } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ConfirmDialog from "@/components/common/ConfirmDialog.jsx";
import { setUnsavedChange } from "@/utils/unsavedChanges.js";

const MAX_IMAGES = 6;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_RENT = 100_000_000;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function ListingForm({ initial, onSubmit, onCancel }) {
  const navigate = useNavigate();
  const dirtySourceId = useId();
  const [images, setImages] = useState([]);
  const [keptImages, setKeptImages] = useState(initial?.images || []);
  const [error, setError] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [showDiscardConfirmation, setShowDiscardConfirmation] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const previews = useMemo(
    () => images.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [images],
  );

  useEffect(
    () => () => previews.forEach(({ url }) => URL.revokeObjectURL(url)),
    [previews],
  );

  function requestCancel() {
    if (!onCancel || isSubmitting) return;
    if (isDirty) setShowDiscardConfirmation(true);
    else onCancel();
  }

  function cancelDiscard() {
    setShowDiscardConfirmation(false);
    setPendingNavigation(null);
  }

  function confirmDiscard() {
    const destination = pendingNavigation;
    setShowDiscardConfirmation(false);
    setPendingNavigation(null);
    setIsDirty(false);

    if (destination) {
      navigate(destination);
      return;
    }
    onCancel?.();
  }

  useEffect(() => {
    setUnsavedChange(dirtySourceId, isDirty);
    return () => setUnsavedChange(dirtySourceId, false);
  }, [dirtySourceId, isDirty]);

  useEffect(() => {
    if (!isDirty || isSubmitting) return undefined;

    function handleBeforeUnload(event) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, isSubmitting]);

  // Guard ordinary internal links while a changed form is open.
  useEffect(() => {
    if (!isDirty || isSubmitting) return undefined;

    function handleInternalNavigation(event) {
      if (
        event.defaultPrevented || event.button !== 0 || event.metaKey ||
        event.ctrlKey || event.shiftKey || event.altKey
      ) return;

      const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!anchor || (anchor.target && anchor.target !== "_self") || anchor.hasAttribute("download")) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;

      const destination = `${url.pathname}${url.search}${url.hash}`;
      const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (destination === current) return;

      event.preventDefault();
      setPendingNavigation(destination);
      setShowDiscardConfirmation(true);
    }

    document.addEventListener("click", handleInternalNavigation, true);
    return () => document.removeEventListener("click", handleInternalNavigation, true);
  }, [isDirty, isSubmitting]);

  function selectImages(event) {
    const selected = Array.from(event.target.files || []);
    event.target.value = "";
    if (!selected.length) return;

    const invalidType = selected.find((file) => !ACCEPTED_TYPES.includes(file.type));
    if (invalidType) {
      setError("Choose JPEG, PNG, WEBP, or GIF images.");
      return;
    }
    if (selected.some((file) => file.size > MAX_FILE_SIZE)) {
      setError("Each image must be 5 MB or smaller.");
      return;
    }
    if (keptImages.length + images.length + selected.length > MAX_IMAGES) {
      setError(`You can add up to ${MAX_IMAGES} photos in total. Remove a photo before adding more.`);
      return;
    }

    setError("");
    setImages((current) => [...current, ...selected]);
    setIsDirty(true);
  }

  function removeNewImage(file) {
    setImages((current) => current.filter((entry) => entry !== file));
    setIsDirty(true);
  }

  async function submit(event) {
    event.preventDefault();
    if (submittingRef.current) return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const requiredFields = [
      ["title", "Enter a title for your property."],
      ["city", "Enter the city where the property is located."],
      ["locality", "Enter the area or locality."],
      ["description", "Add a short description of the property."],
    ];

    for (const [name, message] of requiredFields) {
      const field = form.elements.namedItem(name);
      const value = String(formData.get(name) || "").trim();
      if (!value) {
        setError(message);
        field?.focus();
        return;
      }
      formData.set(name, value);
    }

    const rentText = String(formData.get("rent") ?? "").trim();
    const rent = Number(rentText);
    if (!rentText || !Number.isFinite(rent) || rent < 0 || rent > MAX_RENT) {
      setError("Enter a valid monthly rent between ₹0 and ₹10,00,00,000.");
      form.elements.namedItem("rent")?.focus();
      return;
    }

    const depositText = String(formData.get("deposit") ?? "").trim();
    if (depositText) {
      const deposit = Number(depositText);
      if (!Number.isFinite(deposit) || deposit < 0 || deposit > MAX_RENT) {
        setError("Enter a valid deposit amount, or leave it blank.");
        form.elements.namedItem("deposit")?.focus();
        return;
      }
      formData.set("deposit", depositText);
    }

    const amenities = String(formData.get("amenities") || "")
      .split(",")
      .map((amenity) => amenity.trim())
      .filter(Boolean);
    if (amenities.length > 30) {
      setError("Add no more than 30 amenities.");
      form.elements.namedItem("amenities")?.focus();
      return;
    }
    if (amenities.some((amenity) => amenity.length > 60)) {
      setError("Each amenity must be 60 characters or fewer.");
      form.elements.namedItem("amenities")?.focus();
      return;
    }

    formData.set("amenities", amenities.join(", "));
    formData.delete("images");
    images.forEach((file) => formData.append("images", file));

    // `removedImages` is only accepted by the update validator, not create.
    if (initial) {
      formData.set(
        "removedImages",
        JSON.stringify(
          (initial.images || [])
            .filter((image) => !keptImages.includes(image))
            .map((image) => image.url),
        ),
      );
    } else {
      formData.delete("removedImages");
    }

    setError("");
    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (submitError) {
      setError(
        submitError.response?.data?.message ||
          "We couldn't save your listing. Please try again.",
      );
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  const photoCount = keptImages.length + images.length;

  return (
    <form
      className={`listing-form${isSubmitting ? " is-submitting" : ""}`}
      onSubmit={submit}
      onChangeCapture={() => {
        setIsDirty(true);
        if (error) setError("");
      }}
      aria-busy={isSubmitting}
      noValidate={false}
    >
      <div className="listing-form-heading">
        <span className="eyebrow">{initial ? "KEEP YOUR DETAILS CURRENT" : "HELP SOMEONE FIND HOME"}</span>
        <h2>{initial ? "Update your listing" : "Tell us about your place"}</h2>
        <p>Clear details help people decide whether your space is right for them. Fields marked <span aria-hidden="true">*</span> are required.</p>
      </div>

      <section className="listing-form-section" aria-labelledby="listing-basics-heading">
        <div className="listing-form-section-heading">
          <span className="listing-form-section-icon"><MapPin size={18} /></span>
          <div>
            <h3 id="listing-basics-heading">Location and basics</h3>
            <p>Where is the property, and what kind of home is it?</p>
          </div>
        </div>
        <div className="form-grid">
          <label>
            Listing title <span className="required-mark">*</span>
            <input name="title" disabled={isSubmitting} required maxLength={120} autoComplete="off" defaultValue={initial?.title || ""} placeholder="e.g. Sunny room near the university" />
            <small>Give your home a clear, memorable title.</small>
          </label>
          <label>
            City <span className="required-mark">*</span>
            <input name="city" disabled={isSubmitting} required maxLength={100} autoComplete="address-level2" defaultValue={initial?.city || ""} placeholder="e.g. Ahmedabad" />
          </label>
          <label>
            Locality / area <span className="required-mark">*</span>
            <input name="locality" disabled={isSubmitting} required maxLength={120} autoComplete="address-level3" defaultValue={initial?.locality || ""} placeholder="e.g. Navrangpura" />
          </label>
          <label>
            Street address <span className="optional-mark">Optional</span>
            <input name="address" disabled={isSubmitting} maxLength={300} autoComplete="street-address" defaultValue={initial?.address || ""} placeholder="Add a nearby street or landmark" />
            <small>Share only the location detail you're comfortable showing.</small>
          </label>
          <label>
            Home type
            <select name="propertyType" disabled={isSubmitting} defaultValue={initial?.propertyType || "room"}>
              <option value="room">Room</option>
              <option value="flat">Flat</option>
              <option value="pg">PG</option>
            </select>
          </label>
          <label>
            Available for
            <select name="availableFor" disabled={isSubmitting} defaultValue={initial?.availableFor || "anyone"}>
              <option value="anyone">Anyone</option>
              <option value="boys">Boys</option>
              <option value="girls">Girls</option>
              <option value="family">Family</option>
            </select>
          </label>
          <label>
            Furnishing
            <select name="furnishing" disabled={isSubmitting} defaultValue={initial?.furnishing || "unfurnished"}>
              <option value="furnished">Furnished</option>
              <option value="semi">Semi-furnished</option>
              <option value="unfurnished">Unfurnished</option>
            </select>
          </label>
        </div>
      </section>

      <section className="listing-form-section" aria-labelledby="listing-price-heading">
        <div className="listing-form-section-heading">
          <span className="listing-form-section-icon"><IndianRupee size={18} /></span>
          <div>
            <h3 id="listing-price-heading">Monthly cost</h3>
            <p>Be upfront about the ongoing rent and one-time deposit.</p>
          </div>
        </div>
        <div className="form-grid">
          <label>
            Monthly rent (₹) <span className="required-mark">*</span>
            <input name="rent" disabled={isSubmitting} type="number" min="0" max={MAX_RENT} step="1" required defaultValue={initial?.rent ?? ""} placeholder="e.g. 9000" inputMode="numeric" />
            <small>What the tenant pays each month.</small>
          </label>
          <label>
            Security deposit (₹) <span className="optional-mark">Optional</span>
            <input name="deposit" disabled={isSubmitting} type="number" min="0" max={MAX_RENT} step="1" defaultValue={initial?.deposit ?? ""} placeholder="e.g. 18000" inputMode="numeric" />
            <small>Leave blank if there is no deposit.</small>
          </label>
        </div>
      </section>

      <section className="listing-form-section" aria-labelledby="listing-description-heading">
        <div className="listing-form-section-heading">
          <span className="listing-form-section-icon"><House size={18} /></span>
          <div>
            <h3 id="listing-description-heading">About the home</h3>
            <p>Help seekers understand what makes this space a good fit.</p>
          </div>
        </div>
        <div className="form-grid">
          <label className="wide">
            Description <span className="required-mark">*</span>
            <textarea name="description" disabled={isSubmitting} required maxLength={5000} defaultValue={initial?.description || ""} placeholder="Describe the room, natural light, nearby transport, house rules, and anything else a seeker should know." />
            <small>Up to 5,000 characters. Be specific and honest about the space.</small>
          </label>
          <label className="wide">
            Amenities <span className="optional-mark">Optional</span>
            <input name="amenities" disabled={isSubmitting} maxLength={2000} placeholder="wifi, parking, laundry" defaultValue={(initial?.amenities || []).join(", ")} />
            <small>Separate items with commas (for example: Wi-Fi, parking, washing machine). Empty items are ignored.</small>
          </label>
        </div>
      </section>

      <section className="listing-form-section" aria-labelledby="listing-photos-heading">
        <div className="listing-form-section-heading">
          <span className="listing-form-section-icon"><ImagePlus size={18} /></span>
          <div>
            <h3 id="listing-photos-heading">Property photos</h3>
            <p>Bright, clear photos help seekers picture the space.</p>
          </div>
        </div>
        <label className="listing-photo-input-label">
          Add photos <span className="optional-mark">Optional</span>
          <input
            name="images"
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif"
            disabled={isSubmitting || photoCount >= MAX_IMAGES}
            aria-describedby="listing-photo-help"
            onChange={selectImages}
          />
          <small id="listing-photo-help">JPEG, PNG, WEBP, or GIF · max 5 MB each · {photoCount}/{MAX_IMAGES} photos</small>
        </label>
        <p className="listing-photo-tip">Tip: include the main room, kitchen or bathroom where relevant, and a helpful view of the space. Don't upload documents containing personal information.</p>
        {(keptImages.length > 0 || previews.length > 0) ? (
          <div className="image-previews" aria-label="Selected property photos">
            {keptImages.map((image, index) => (
              <div className="image-preview" key={image.url}>
                <img src={image.url} alt={`Existing property photo ${index + 1}`} />
                <button
                  type="button"
                  aria-label={`Remove existing photo ${index + 1}`}
                  disabled={isSubmitting}
                  onClick={() => {
                    setKeptImages((current) => current.filter((entry) => entry !== image));
                    setIsDirty(true);
                  }}
                >
                  <X size={15} />
                </button>
              </div>
            ))}
            {previews.map(({ file, url }, index) => (
              <div className="image-preview" key={`${file.name}-${file.lastModified}`}>
                <img src={url} alt={`Preview of ${file.name}`} />
                <button
                  type="button"
                  aria-label={`Remove selected photo ${index + 1}: ${file.name}`}
                  disabled={isSubmitting}
                  onClick={() => removeNewImage(file)}
                >
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="listing-photo-empty">
            <ImagePlus size={22} aria-hidden="true" />
            <span>No photos selected yet</span>
            <small>You can add up to {MAX_IMAGES} photos.</small>
          </div>
        )}
      </section>

      {error && <p role="alert" className="upload-error listing-form-error">{error}</p>}
      {isSubmitting && <p className="listing-form-submit-status" role="status" aria-live="polite">{initial ? "Saving your changes…" : "Publishing your listing…"} Please keep this page open.</p>}

      <div className="listing-form-actions">
        <button className="button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? (initial ? "Saving changes…" : "Publishing…") : (initial ? "Save changes" : "Publish listing")}
        </button>
        {onCancel && (
          <button className="text-button form-cancel" type="button" onClick={requestCancel} disabled={isSubmitting}>
            Cancel
          </button>
        )}
      </div>

      <ConfirmDialog
        open={showDiscardConfirmation}
        title="Discard unsaved changes?"
        description="Your changes to this listing have not been saved. Do you want to discard them?"
        confirmLabel="Discard changes"
        cancelLabel="Keep editing"
        destructive
        onCancel={cancelDiscard}
        onConfirm={confirmDiscard}
      />
    </form>
  );
}

export default ListingForm;
