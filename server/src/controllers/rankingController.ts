import type { Request, Response } from "express";
import { pool } from "../config/db.js";

const sorts: Record<string, string> = {
  goals: "total_goals", assists: "total_assists", rating: "average_rating", matches: "matches_played"
};

export async function getRankings(req: Request, res: Response): Promise<void> {
  try {
    const sort = sorts[String(req.query.sort ?? "goals")] ?? sorts.goals;
    const limit = Math.min(Math.max(Number(req.query.limit) || 25, 1), 100);
    const result = await pool.query(`
      SELECT p.player_id, p.player_name, p.team, p.position,
        COUNT(pf.id)::int AS matches_played,
        COALESCE(SUM(pf.goals), 0)::int AS total_goals,
        COALESCE(SUM(pf.assists), 0)::int AS total_assists,
        ROUND(AVG(pf.player_rating), 2) AS average_rating
      FROM players p
      JOIN performances pf ON pf.player_id = p.player_id
      GROUP BY p.player_id, p.player_name, p.team, p.position
      ORDER BY ${sort} DESC NULLS LAST, p.player_name ASC
      LIMIT $1
    `, [limit]);
    res.json(result.rows);
  } catch (error) { console.error(error); res.status(500).json({ message: "Unable to load rankings" }); }
}
