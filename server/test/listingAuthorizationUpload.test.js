import test from "node:test";
import assert from "node:assert/strict";
import { Listing } from "../src/models/index.js";
import cloudinary from "../src/config/cloudinary.js";
import { updateListing } from "../src/services/listingService.js";

test("does not upload images when a non-owner attempts an update", async (t) => {
    const previousCloudName = process.env.CLOUDINARY_CLOUD_NAME;
    process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";

    t.after(() => {
        if (previousCloudName === undefined) {
            delete process.env.CLOUDINARY_CLOUD_NAME;
        } else {
            process.env.CLOUDINARY_CLOUD_NAME = previousCloudName;
        }
    });

    let uploadAttempts = 0;

    t.mock.method(Listing, "findById", async () => ({
        owner: "actual-owner",
    }));

    t.mock.method(cloudinary.uploader, "upload_stream", (_options, callback) => {
        uploadAttempts += 1;

        return {
            end() {
                callback(new Error("Upload must not be attempted"));
            },
        };
    });

    await assert.rejects(
        updateListing(
            "listing-test-123",
            "different-owner",
            { title: "Updated room" },
            [{ buffer: Buffer.from("test image") }],
        ),
        (error) => error.status === 403,
    );

    assert.equal(uploadAttempts, 0);
});