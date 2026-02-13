import { Pool } from "pg";
import { ITokenRepository } from "./token.interface";

class PostgresTokenRepository implements ITokenRepository {
  public pool: Pool;
  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
    });
  }

  public async store(token: string): Promise<void> {
    try {
      await this.pool.query("INSERT INTO token(value) VALUES ($1);", [token]);
    } catch (err) {}
  }

  public async getStatus(token: string): Promise<boolean> {
    try {
      const result = await this.pool.query(
        "SELECT is_used FROM token WHERE value = $1",
        [token],
      );
      return result.rows[0].is_used;
    } catch (error) {}
  }

  public async toggleStatus(token: string): Promise<void> {
    try {
      await this.pool.query(
        "UPDATE token SET is_used = true WHERE value = $1 AND is_used = false",
        [token],
      );
    } catch (error) {}
  }
}

export default PostgresTokenRepository;
