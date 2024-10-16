import { PGlite } from "@electric-sql/pglite";
import path from "path";
import fs from "fs";

let db: PGlite | null = null;

export async function getDB() {
  if (!db) {
    const dataDir =
      process.env.NODE_ENV === "production"
        ? "/data/pgdata"
        : path.join(process.cwd(), "pgdata");

    console.log(`Initializing PGlite with data directory: ${dataDir}`);

    if (!fs.existsSync(dataDir)) {
      console.log(`Data directory does not exist. Creating it.`);
      fs.mkdirSync(dataDir, { recursive: true });
    }

    db = new PGlite({
      database: path.join(dataDir, "postgres.data"),
    });

    await db.exec(`
      CREATE TABLE IF NOT EXISTS todo (
        id SERIAL PRIMARY KEY,
        task TEXT,
        done BOOLEAN DEFAULT FALSE
      );
    `);
    console.log("Todo table created or already exists");
  }
  return db;
}
