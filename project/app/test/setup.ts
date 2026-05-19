import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { sql } from "drizzle-orm";
import { afterAll, afterEach, beforeEach, vi } from "vitest";

import * as schema from "@/app/db/schema";
import { db } from "@/app/lib/drizzle";

let testClient: PGlite

// Replace the database with a new in-memory database
vi.mock("@/app/lib/drizzle", async () => {
  testClient = new PGlite();
  const mockDb = drizzle(testClient, { schema });
  return { db: mockDb };
});

beforeEach(async () => {
  await db.execute(sql`create schema if not exists public`)
});

afterEach(async () => {
  await db.execute(sql`drop schema if exists public cascade`);
  await db.execute(sql`create schema public`);
});

afterAll(async () => {
  if (testClient) testClient.close();
});
