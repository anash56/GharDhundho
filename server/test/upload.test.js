
import test from "node:test";
import assert from "node:assert/strict";
import {
  validateImageFiles,
} from "../src/middleware/upload.js";

test("accepts JPEG with a matching signature", () => {
  const buffer = Buffer.from([0xff, 0xd8, 0xff, 0x00]);

  assert.equal(
    validateImageFiles([{ mimetype: "image/jpeg", buffer }]),
    true,
  );
});

test("accepts PNG with a matching signature", () => {
  const buffer = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);

  assert.equal(
    validateImageFiles([{ mimetype: "image/png", buffer }]),
    true,
  );
});

test("accepts GIF with a matching signature", () => {
  const buffer = Buffer.from("GIF89a");

  assert.equal(
    validateImageFiles([{ mimetype: "image/gif", buffer }]),
    true,
  );
});

test("accepts WEBP with a matching container signature", () => {
  const buffer = Buffer.from("RIFF0000WEBP");

  assert.equal(
    validateImageFiles([{ mimetype: "image/webp", buffer }]),
    true,
  );
});

test("rejects a fake JPEG containing plain text", () => {
  assert.throws(
    () =>
      validateImageFiles([
        {
          mimetype: "image/jpeg",
          buffer: Buffer.from("this is not an image"),
        },
      ]),
    { status: 400 },
  );
});

test("rejects a MIME type that is not supported", () => {
  assert.throws(
    () =>
      validateImageFiles([
        {
          mimetype: "image/svg+xml",
          buffer: Buffer.from("<svg></svg>"),
        },
      ]),
    { status: 400 },
  );
});

test("rejects an empty or missing file buffer", () => {
  assert.throws(
    () =>
      validateImageFiles([
        { mimetype: "image/png", buffer: Buffer.alloc(0) },
      ]),
    { status: 400 },
  );

  assert.throws(
    () =>
      validateImageFiles([
        { mimetype: "image/png" },
      ]),
    { status: 400 },
  );
});

test("accepts an empty upload list", () => {
  assert.equal(validateImageFiles([]), true);
});
