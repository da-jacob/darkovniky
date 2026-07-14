import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(filename: string): void {
  try {
    const contents = readFileSync(resolve(process.cwd(), filename), "utf8");
    for (const line of contents.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const separator = trimmed.indexOf("=");
      if (separator === -1) continue;
      const key = trimmed.slice(0, separator).trim();
      const value = trimmed.slice(separator + 1).trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // optional local env file
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

async function main() {
  await import("reflect-metadata");
  const { ensureSchema } = await import("../src/lib/db");
  await ensureSchema();
  console.log("Database schema is up to date.");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
