import { Pool } from "pg";
import * as fs from "fs/promises";
import * as dotenv from "dotenv";
dotenv.config();

async function initializeDatabase() {
  const client = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT),
    // ssl: {
    //   rejectUnauthorized: false, // Ignore la vérification du certificat (pour Render)
    // },
  });

  try {
    console.log("Connecting to the database...");
    await client.connect();

    console.log("Reading SQL file...");
    const sql = await fs.readFile("./src/docs/init.sql", "utf-8");

    console.log("Executing SQL script...");
    await client.query(sql);

    console.log("Database initialized successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error initializing the database:", error);
    process.exit(0);
  } finally {
    await client.end();
    console.log("Database connection closed.");
    process.exit(0);
  }
}

initializeDatabase();
