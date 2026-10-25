
import test from "node:test";
import assert from "node:assert/strict";
import {
  validateNewListing,
  validateListingUpdates,
} from "../src/validators/listingValidator.js";

const validListing = {
  title: "Room near college",
  description: "A clean room for rent.",
  city: "Ahmedabad",
  locality: "Navrangpura",
  propertyType: "room",
  rent: "8000",
};

test("accepts valid listing data", () => {
  assert.doesNotThrow(() => validateNewListing({ ...validListing }));
});

test("rejects client-controlled owner and images fields", () => {
  assert.throws(
    () => validateNewListing({ ...validListing, owner: "attacker-id" }),
    { status: 400 },
  );

  assert.throws(
    () => validateNewListing({
      ...validListing,
      images: [{ url: "https://example.com/fake.jpg" }],
    }),
    { status: 400 },
  );
});

test("rejects removedImages during listing creation", () => {
  assert.throws(
    () => validateNewListing({ ...validListing, removedImages: "[]" }),
    { status: 400 },
  );
});

test("rejects invalid property types", () => {
  assert.throws(
    () => validateNewListing({ ...validListing, propertyType: "villa" }),
    { status: 400 },
  );
});

test("rejects negative rent", () => {
  assert.throws(
    () => validateNewListing({ ...validListing, rent: "-500" }),
    { status: 400 },
  );
});

test("rejects whitespace-only rent", () => {
  assert.throws(
    () => validateNewListing({ ...validListing, rent: "   " }),
    { status: 400 },
  );
});

test("rejects malformed removed-image JSON during updates", () => {
  assert.throws(
    () => validateListingUpdates({ removedImages: "[invalid" }),
    { status: 400 },
  );
});

test("rejects unknown fields during updates", () => {
  assert.throws(
    () => validateListingUpdates({ isAvailable: "true", owner: "attacker" }),
    { status: 400 },
  );
});

test("accepts a valid partial update", () => {
  assert.doesNotThrow(() => validateListingUpdates({ rent: "9500" }));
});
