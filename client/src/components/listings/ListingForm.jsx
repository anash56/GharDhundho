import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";

const MAX_IMAGES = 6;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function ListingForm({ initial, onSubmit, onCancel }) {
  const [images, setImages] = useState([]);
  const [keptImages, setKeptImages] = useState(initial?.images || []);
  const [error, setError] = useState("");
  const previews = useMemo(
    () => images.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [images],
  );
  useEffect(
    () => () => previews.forEach(({ url }) => URL.revokeObjectURL(url)),
    [previews],
  );

  function selectImages(event) {
    const selected = Array.from(event.target.files || []);
    event.target.value = "";
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
      setError("You can add up to 6 images in total.");
      return;
    }
    setError("");
    setImages((current) => [...current, ...selected]);
  }

  function removeNewImage(file) {
    setImages((current) => current.filter((entry) => entry !== file));
  }

  async function submit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
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

    await onSubmit(formData);
  }

  return (
    <form className="listing-form" onSubmit={submit}>
      <h2>{initial ? "Edit your listing" : "Tell us about your place"}</h2>
      <div className="form-grid">
        <label>
          Listing title
          <input name="title" required defaultValue={initial?.title || ""} />
        </label>
        <label>
          City
          <input name="city" required defaultValue={initial?.city || ""} />
        </label>
        <label>
          Locality
          <input name="locality" required defaultValue={initial?.locality || ""} />
        </label>
        <label>
          Monthly rent (₹)
          <input name="rent" type="number" min="0" required defaultValue={initial?.rent ?? ""} />
        </label>
        <label>
          Deposit (₹)
          <input name="deposit" type="number" min="0" defaultValue={initial?.deposit ?? ""} />
        </label>
        <label>
          Home type
          <select name="propertyType" defaultValue={initial?.propertyType || "room"}>
            <option value="room">room</option>
            <option value="flat">flat</option>
            <option value="pg">pg</option>
          </select>
        </label>
        <label>
          Available for
          <select name="availableFor" defaultValue={initial?.availableFor || "anyone"}>
            <option value="anyone">anyone</option>
            <option value="boys">boys</option>
            <option value="girls">girls</option>
            <option value="family">family</option>
          </select>
        </label>
        <label>
          Furnishing
          <select name="furnishing" defaultValue={initial?.furnishing || "furnished"}>
            <option value="furnished">furnished</option>
            <option value="semi">semi</option>
            <option value="unfurnished">unfurnished</option>
          </select>
        </label>
        <label className="wide">
          Description
          <textarea name="description" required defaultValue={initial?.description || "A comfortable home for testing."} />
        </label>
        <label className="wide">
          Amenities (comma separated)
          <input name="amenities" placeholder="wifi, parking, laundry" defaultValue={(initial?.amenities || []).join(", ")} />
        </label>
        <label className="wide">
          Photos (up to 6)
          <input
            name="images"
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={selectImages}
          />
          <small>
            JPEG, PNG, WEBP, or GIF · max 5 MB each · {keptImages.length + images.length}/{MAX_IMAGES}
          </small>
        </label>
      </div>
      {error && <p role="alert" className="upload-error">{error}</p>}
      {(keptImages.length > 0 || previews.length > 0) && (
        <div className="image-previews" aria-label="Image previews">
          {keptImages.map((image) => (
            <div className="image-preview" key={image.url}>
              <img src={image.url} alt={`Existing photo for ${initial?.title || "listing"}`} />
              <button
                type="button"
                aria-label="Remove existing image"
                onClick={() => setKeptImages((current) => current.filter((entry) => entry !== image))}
              >
                <X size={15} />
              </button>
            </div>
          ))}
          {previews.map(({ file, url }) => (
            <div className="image-preview" key={`${file.name}-${file.lastModified}`}>
              <img src={url} alt={`Preview ${file.name}`} />
              <button type="button" aria-label={`Remove ${file.name}`} onClick={() => removeNewImage(file)}>
                <X size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
      <button className="button" type="submit">{initial ? "Save changes" : "Publish listing"}</button>
      {onCancel && (
        <button className="text-button form-cancel" type="button" onClick={onCancel}>
          Cancel
        </button>
      )}
    </form>
  );
}

export default ListingForm;
