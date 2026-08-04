import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;
const dbPassword = process.env.DATABASE_PASSWORD || "d5f91Nv0ZYUpdDKc";
const projectId = "wikmowwwixnpluqokyay";

const connectionConfigs = [
  {
    host: `db.${projectId}.supabase.co`,
    port: 5432,
    user: "postgres",
    password: dbPassword,
    database: "postgres",
    ssl: { rejectUnauthorized: false }
  },
  {
    host: `aws-0-ap-southeast-1.pooler.supabase.com`,
    port: 6543,
    user: `postgres.${projectId}`,
    password: dbPassword,
    database: "postgres",
    ssl: { rejectUnauthorized: false }
  },
  {
    host: `aws-0-us-east-1.pooler.supabase.com`,
    port: 6543,
    user: `postgres.${projectId}`,
    password: dbPassword,
    database: "postgres",
    ssl: { rejectUnauthorized: false }
  }
];

async function runMigration() {
  const sqlPath = path.resolve("supabase/migrations/20260805000000_create_songs_table.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");

  let connectedClient = null;

  for (const config of connectionConfigs) {
    console.log(`Attempting connection to ${config.host}:${config.port}...`);
    const client = new Client(config);
    try {
      await client.connect();
      console.log(`Successfully connected to ${config.host}!`);
      connectedClient = client;
      break;
    } catch (err) {
      console.warn(`Connection to ${config.host} failed:`, err.message);
    }
  }

  if (!connectedClient) {
    console.error("Could not connect to any Postgres host.");
    process.exit(1);
  }

  try {
    console.log("Applying migration script...");
    await connectedClient.query(sql);
    console.log("✅ Migration applied successfully!");

    const res = await connectedClient.query("SELECT count(*) FROM public.songs;");
    console.log(`Songs table count query: ${res.rows[0].count}`);
  } catch (err) {
    console.error("❌ Migration error:", err);
  } finally {
    await connectedClient.end();
  }
}

runMigration();
