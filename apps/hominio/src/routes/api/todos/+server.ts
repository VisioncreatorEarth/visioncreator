import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { PGlite } from "@electric-sql/pglite";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

let db: PGlite;

async function initDB() {
  if (!db) {
    // Get the current file's directory
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

    // Create a path for the database files
    const dataDir = path.join(__dirname, "..", "..", "..", "..", "pgdata");

    // Initialize PGlite with the file system path
    db = new PGlite(dataDir);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS todo (
        id SERIAL PRIMARY KEY,
        task TEXT,
        done BOOLEAN DEFAULT false
      );
    `);
  }
}

export const GET: RequestHandler = async () => {
  await initDB();
  const result = await db.query("SELECT * FROM todo ORDER BY id");
  return json(result.rows);
};

export const POST: RequestHandler = async ({ request }) => {
  await initDB();
  const { task } = await request.json();
  await db.query("INSERT INTO todo (task) VALUES ($1)", [task]);
  return json({ success: true });
};

export const PUT: RequestHandler = async ({ request }) => {
  await initDB();
  const { id, done } = await request.json();
  await db.query("UPDATE todo SET done = $1 WHERE id = $2", [done, id]);
  return json({ success: true });
};

export const DELETE: RequestHandler = async ({ request }) => {
  await initDB();
  const { id } = await request.json();
  await db.query("DELETE FROM todo WHERE id = $1", [id]);
  return json({ success: true });
};
