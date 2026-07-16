import type { Request, Response } from "express";
import { pool } from "../config/db.js";

export async function getPlayers(_req: Request, res: Response): Promise<void> {
  try {
    const result = await pool.query("SELECT player_id, player_name, team, jersey_number, position FROM players ORDER BY player_name");
    res.json(result.rows);
  } catch (error) { console.error(error); res.status(500).json({ message: "Unable to load players" }); }
}

export async function getMatches(_req: Request, res: Response): Promise<void> {
  try {
    const result = await pool.query("SELECT match_id, match_date, stadium, city, tournament_stage FROM matches ORDER BY match_date DESC, match_id");
    res.json(result.rows);
  } catch (error) { console.error(error); res.status(500).json({ message: "Unable to load matches" }); }
}

export async function getFilters(_req: Request, res: Response): Promise<void> {
  try {
    const [teams, positions] = await Promise.all([
      pool.query("SELECT DISTINCT team FROM players WHERE team IS NOT NULL ORDER BY team"),
      pool.query("SELECT DISTINCT position FROM players WHERE position IS NOT NULL ORDER BY position")
    ]);
    res.json({ teams: teams.rows.map(r => r.team), positions: positions.rows.map(r => r.position) });
  } catch (error) { console.error(error); res.status(500).json({ message: "Unable to load filters" }); }
}
