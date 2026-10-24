import { loadEnv } from "./config/env.js";
import { connectDatabase } from "./config/db.js";
import app from "./app.js";

async function start() {
  const env = loadEnv();
  await connectDatabase(env.mongoUri);
  app.listen(env.port, () => console.log(`API listening on ${env.port}`));
}

start().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
