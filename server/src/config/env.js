import "dotenv/config";

const nodeEnv = process.env.NODE_ENV || "development";
const rawTrustProxyHops = process.env.TRUST_PROXY_HOPS?.trim();
const configuredClientUrl = process.env.CLIENT_URL?.trim();

function normalizeOrigin(value) {
  if (!value) return value;
  try {
    const url = new URL(value);
    // Only normalize a pure origin. loadEnv() reports paths, queries, and invalid URLs.
    if (url.pathname === "/" && !url.search && !url.hash) return url.origin;
  } catch {
    // loadEnv() emits the actionable configuration error below.
  }
  return value;
}

export const env = {
  nodeEnv,
  isProduction: nodeEnv === "production",
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGO_URI?.trim() || "mongodb://127.0.0.1:27017/ghardhundho",
  jwtSecret: process.env.JWT_SECRET,
  clientUrl: normalizeOrigin(configuredClientUrl || (nodeEnv === "production" ? "" : "http://localhost:5173")),
  trustProxyHops: rawTrustProxyHops ? Number(rawTrustProxyHops) : false,
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,
};

/** Validate critical environment configuration before the API starts listening. */
export function loadEnv() {
  if (typeof env.jwtSecret !== "string" || env.jwtSecret.trim().length < 32) {
    throw new Error("JWT_SECRET must be set to a secret containing at least 32 characters.");
  }
  env.jwtSecret = env.jwtSecret.trim();

  if (!Number.isInteger(env.port) || env.port < 1 || env.port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535.");
  }

  if (!env.mongoUri) {
    throw new Error("MONGO_URI must be configured.");
  }

  if (env.isProduction && !env.clientUrl) {
    throw new Error("CLIENT_URL must be set to the deployed frontend origin in production.");
  }

  if (env.clientUrl) {
    let clientUrl;
    try {
      clientUrl = new URL(env.clientUrl);
    } catch {
      throw new Error("CLIENT_URL must be a valid absolute URL, such as https://example.com.");
    }
    if (!["http:", "https:"].includes(clientUrl.protocol)) {
      throw new Error("CLIENT_URL must use HTTP or HTTPS.");
    }
    if (clientUrl.pathname !== "/" || clientUrl.search || clientUrl.hash) {
      throw new Error("CLIENT_URL must contain only the frontend origin, without a path or query.");
    }
  }

  if (
    rawTrustProxyHops &&
    (!Number.isInteger(env.trustProxyHops) || env.trustProxyHops < 0)
  ) {
    throw new Error("TRUST_PROXY_HOPS must be a non-negative integer when provided.");
  }

  return env;
}
