
import test from "node:test";
import assert from "node:assert/strict";
import { Listing } from "../src/models/index.js";
import {
  updateListing,
  deleteListing,
} from "../src/services/listingService.js";

test("update rejects a listing owned by another user", async (t) => {
  const listing = {
    owner: "owner-123",
    images: [],
  };

  t.mock.method(Listing, "findById", async () => listing);

  await assert.rejects(
    updateListing("listing-123", "different-user", { title: "Updated room" }),
    (error) => error.status === 403,
  );
});

test("update returns 404 when the listing does not exist", async (t) => {
  t.mock.method(Listing, "findById", async () => null);

  await assert.rejects(
    updateListing("missing-listing", "owner-123", { title: "Updated room" }),
    (error) => error.status === 404,
  );
});

test("delete rejects a non-owner when the listing exists", async (t) => {
  t.mock.method(Listing, "findOne", async () => null);
  t.mock.method(Listing, "exists", async () => ({ _id: "listing-123" }));

  await assert.rejects(
    deleteListing("listing-123", {
      id: "different-user",
      role: "owner",
    }),
    (error) => error.status === 403,
  );
});

test("delete returns 404 when the listing does not exist", async (t) => {
  t.mock.method(Listing, "findOne", async () => null);
  t.mock.method(Listing, "exists", async () => null);

  await assert.rejects(
    deleteListing("missing-listing", {
      id: "owner-123",
      role: "owner",
    }),
    (error) => error.status === 404,
  );
});
