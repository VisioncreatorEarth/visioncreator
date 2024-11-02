import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getDB } from "$lib/db";

export const GET: RequestHandler = async () => {
  const db = await getDB();
  const result = await db.query("SELECT * FROM todo ORDER BY id");
  return json(result.rows);
};

export const POST: RequestHandler = async ({ request }) => {
  const db = await getDB();
  const { task } = await request.json();
  await db.query("INSERT INTO todo (task) VALUES ($1)", [task]);
  return json({ success: true });
};

export const PUT: RequestHandler = async ({ request }) => {
  const db = await getDB();
  const { id, done } = await request.json();
  await db.query("UPDATE todo SET done = $1 WHERE id = $2", [done, id]);
  return json({ success: true });
};

export const DELETE: RequestHandler = async ({ request }) => {
  const db = await getDB();
  const { id } = await request.json();
  await db.query("DELETE FROM todo WHERE id = $1", [id]);
  return json({ success: true });
};
