import { Pool } from "pg";
import * as dotenv from "dotenv";
import HashPasswordBcryptService from "../hashPassword/hashPasswordBcrypt.service";
dotenv.config();

const convertValue = (emails: string, passwordHashed: string) => {
  return emails
    .split(",")
    .map(
      (email) =>
        `('${email}', '${
          new Date().toISOString().split("T")[0]
        }', '${passwordHashed}', 'admin', 'active')`
    )
    .join(", ");
};

async function initializeDatabase() {
  const bcryptService = new HashPasswordBcryptService();
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

    console.log("Executing SQL script to create ADMIN...");
    if (!process.env.ADMIN_PASSWORD)
      throw new Error("Admin password not entered");
    const passwordHashed = await bcryptService.hashPassword(
      process.env.ADMIN_PASSWORD
    );
    await client.query(
      `
        INSERT INTO subscriber(email, joined_at, password, role, state) 
            VALUES ${convertValue(process.env.ADMIN_EMAIL, passwordHashed)};
        `
      // [process.env.ADMIN_EMAIL, new Date(), passwordHashed, "admin", "active"]
    );

    console.log("Operation successfully!");
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
