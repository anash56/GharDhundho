import "dotenv/config";

/** Validate the environment and provide local defaults. */
export function loadEnv() {
  const env = {
    port: Number(process.env.PORT || 5000),
    mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ghardhundho",
    jwtSecret: process.env.JWT_SECRET,
    clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  };
  if (!env.jwtSecret) {
    throw new Error("JWT_SECRET must be set before the server starts");
  }
  return env;
}
