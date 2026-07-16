import dotenv from "dotenv";
dotenv.config();
import app from "./app.js";
import { pool } from "./config/db.js";
const port = Number(process.env.PORT ?? 3000);
async function start(): Promise<void> {
  try {
    await pool.query("SELECT NOW()");
    app.listen(port, () => console.log(`API running at http://localhost:${port}`));
  } catch (error) {
    console.error("PostgreSQL connection failed:", error);
    process.exit(1);
  }
}
start();
