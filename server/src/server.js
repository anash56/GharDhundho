import { loadEnv } from "./config/env.js";
import { connectDatabase } from "./config/db.js";
import app from "./app.js";

const SAFE_CONFIG_ERRORS = new Set([
  "JWT_SECRET must be set to a secret containing at least 32 characters.",
  "PORT must be an integer between 1 and 65535.",
  "MONGO_URI must be configured.",
  "CLIENT_URL must be set to the deployed frontend origin in production.",
  "CLIENT_URL must be a valid absolute URL, such as https://example.com.",
  "CLIENT_URL must use HTTP or HTTPS.",
  "CLIENT_URL must contain only the frontend origin, without a path or query.",
  "TRUST_PROXY_HOPS must be a non-negative integer when provided.",
  "AUTH_COOKIE_SAME_SITE must be one of: lax, strict, none.",
  "AUTH_COOKIE_SAME_SITE=none requires NODE_ENV=production.",
]);

async function start() {
  const env = loadEnv();
  await connectDatabase(env.mongoUri);
  app.listen(env.port, () => console.log(`API listening on ${env.port}`));
}

start().catch((error) => {
  // Never print raw database-driver errors, which can include connection URIs or credentials.
  if (SAFE_CONFIG_ERRORS.has(error.message)) {
    console.error(`[startup-error] ${error.message}`);
  } else {
    console.error(
      "[startup-error] Server failed to start. Check database connectivity and environment configuration; connection details were not logged.",
    );
  }
  process.exit(1);
});
