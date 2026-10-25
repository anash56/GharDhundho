
import test from "node:test";
import assert from "node:assert/strict";
import { Listing } from "../src/models/index.js";
import cloudinary from "../src/config/cloudinary.js";
import { createListing } from "../src/services/listingService.js";

const validListing = {
  title: "Test room",
  description: "Room for automated testing",
  city: "Ahmedabad",
  locality: "Navrangpura",
  propertyType: "room",
  rent: "8000",
};

test("cleans up uploaded images when listing creation fails", async (t) => {
  const previousCloudName = process.env.CLOUDINARY_CLOUD_NAME;
  process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";

  t.after(() => {
    if (previousCloudName === undefined) {
      delete process.env.CLOUDINARY_CLOUD_NAME;
    } else {
      process.env.CLOUDINARY_CLOUD_NAME = previousCloudName;
    }
  });

  const destroyedIds = [];

  t.mock.method(cloudinary.uploader, "upload_stream", (_options, callback) => ({
    end() {
      callback(null, {
        secure_url: "https://example.com/test.jpg",
        public_id: "test-upload-123",
      });
    },
  }));

  t.mock.method(cloudinary.uploader, "destroy", async (publicId) => {
    destroyedIds.push(publicId);
    return { result: "ok" };
  });

  t.mock.method(Listing, "create", async () => {
    throw new Error("Simulated database save failure");
  });

  await assert.rejects(
    createListing("owner-test-123", { ...validListing }, [
      { buffer: Buffer.from("test image bytes") },
    ]),
    /Simulated database save failure/,
  );

  assert.deepEqual(destroyedIds, ["test-upload-123"]);
});
