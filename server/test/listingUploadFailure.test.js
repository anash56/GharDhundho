import test from "node:test";
import assert from "node:assert/strict";
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

test("cleans up earlier uploads when a later image upload fails", async (t) => {
    const previousCloudName = process.env.CLOUDINARY_CLOUD_NAME;
    process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";

    t.after(() => {
        if (previousCloudName === undefined) {
            delete process.env.CLOUDINARY_CLOUD_NAME;
        } else {
            process.env.CLOUDINARY_CLOUD_NAME = previousCloudName;
        }
    });

    let uploadCount = 0;
    const destroyedIds = [];

    t.mock.method(cloudinary.uploader, "upload_stream", () => {
        uploadCount += 1;
        const currentUpload = uploadCount;

        return {
            end() {
                if (currentUpload === 1) {
                    // First upload succeeds.
                    arguments;
                }
            },
        };
    });
});