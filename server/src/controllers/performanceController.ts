import type { Request, Response } from "express";
import { pool } from "../config/db.js";

const sortColumns: Record<string, string> = {
  player_name: "p.player_name",
  team: "p.team",
  opponent_team: "pf.opponent_team",
  match_date: "m.match_date",
  position: "p.position",
  minutes_played: "pf.minutes_played",
  goals: "pf.goals",
  assists: "pf.assists",
  shots: "pf.shots",
  pass_accuracy: "pf.pass_accuracy",
  player_rating: "pf.player_rating",
};

const editableColumns = [
  "player_id", "match_id", "opponent_team", "match_result", "goals_team", "goals_opponent",
  "minutes_played", "goals", "assists", "shots", "shots_on_target", "expected_goals_xg",
  "expected_assists_xa", "key_passes", "successful_passes", "total_passes", "pass_accuracy",
  "dribbles_attempted", "successful_dribbles", "crosses", "successful_crosses", "tackles",
  "interceptions", "clearances", "blocks", "aerial_duels_won", "aerial_duels_lost",
  "recoveries", "defensive_actions", "fouls_committed", "fouls_suffered", "yellow_cards",
  "red_cards", "offsides", "saves", "save_percentage", "punches", "clean_sheet",
  "goals_conceded", "penalty_saves", "distance_covered_km", "sprint_distance_km",
  "top_speed_kmh", "accelerations", "decelerations", "stamina_score", "player_rating",
  "performance_score", "offensive_contribution", "defensive_contribution", "possession_impact",
  "pressure_resistance", "creativity_score", "consistency_score", "clutch_performance_score"
] as const;

function parsePositiveInt(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export async function getPerformances(req: Request, res: Response): Promise<void> {
  try {
    const page = parsePositiveInt(req.query.page, 1);
    const requestedLimit = parsePositiveInt(req.query.limit, 25);
    const limit = [10, 25, 50, 100].includes(requestedLimit) ? requestedLimit : 25;
    const search = String(req.query.search ?? "").trim();
    const team = String(req.query.team ?? "").trim();
    const position = String(req.query.position ?? "").trim();
    const sort = sortColumns[String(req.query.sort ?? "match_date")] ?? sortColumns.match_date;
    const order = String(req.query.order ?? "desc").toLowerCase() === "asc" ? "ASC" : "DESC";

    const conditions: string[] = [];
    const values: Array<string | number> = [];
    if (search) {
      values.push(`%${search}%`);
      const p = `$${values.length}`;
      conditions.push(`(p.player_name ILIKE ${p} OR p.team ILIKE ${p} OR p.position ILIKE ${p} OR pf.opponent_team ILIKE ${p})`);
    }
    if (team) { values.push(team); conditions.push(`p.team = $${values.length}`); }
    if (position) { values.push(position); conditions.push(`p.position = $${values.length}`); }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const countResult = await pool.query(`
      SELECT COUNT(*)::int AS total
      FROM performances pf
      JOIN players p ON p.player_id = pf.player_id
      JOIN matches m ON m.match_id = pf.match_id
      ${where}
    `, values);

    const offset = (page - 1) * limit;
    const dataValues = [...values, limit, offset];
    const result = await pool.query(`
      SELECT pf.id, pf.player_id, pf.match_id,
        p.player_name, p.team, p.jersey_number, p.position, p.nationality, p.club_name AS club,
        m.match_date, m.stadium, m.city, m.tournament_stage,
        pf.opponent_team, pf.match_result, pf.goals_team, pf.goals_opponent,
        pf.minutes_played, pf.goals, pf.assists, pf.shots, pf.shots_on_target,
        pf.successful_passes, pf.total_passes, pf.pass_accuracy,
        pf.tackles, pf.interceptions, pf.yellow_cards, pf.red_cards,
        pf.distance_covered_km, pf.top_speed_kmh, pf.player_rating
      FROM performances pf
      JOIN players p ON p.player_id = pf.player_id
      JOIN matches m ON m.match_id = pf.match_id
      ${where}
      ORDER BY ${sort} ${order}, pf.id ASC
      LIMIT $${dataValues.length - 1} OFFSET $${dataValues.length}
    `, dataValues);

    const totalRecords = countResult.rows[0].total as number;
    res.json({ data: result.rows, pagination: { page, limit, totalRecords, totalPages: Math.ceil(totalRecords / limit) } });
  } catch (error) {
    console.error("getPerformances:", error);
    res.status(500).json({ message: "Unable to load performances" });
  }
}

export async function getPerformanceById(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) { res.status(400).json({ message: "Invalid performance ID" }); return; }
  try {
    const result = await pool.query(`
      SELECT pf.*, p.player_name, p.age, p.nationality, p.team, p.jersey_number, p.position,
        p.height_cm, p.weight_kg, p.preferred_foot, p.club_name AS club, p.market_value_eur,
        m.match_date, m.stadium, m.city, m.tournament_stage
      FROM performances pf
      JOIN players p ON p.player_id = pf.player_id
      JOIN matches m ON m.match_id = pf.match_id
      WHERE pf.id = $1
    `, [id]);
    if (!result.rowCount) { res.status(404).json({ message: "Performance not found" }); return; }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("getPerformanceById:", error);
    res.status(500).json({ message: "Unable to load performance" });
  }
}

export async function createPerformance(req: Request, res: Response): Promise<void> {
  try {
    if (!req.body.player_id || !req.body.match_id) {
      res.status(400).json({ message: "player_id and match_id are required" }); return;
    }
    const columns = editableColumns.filter((column) => req.body[column] !== undefined);
    const values = columns.map((column) => req.body[column] === "" ? null : req.body[column]);
    const placeholders = columns.map((_, index) => `$${index + 1}`);
    const result = await pool.query(
      `INSERT INTO performances (${columns.join(", ")}) VALUES (${placeholders.join(", ")}) RETURNING *`, values
    );
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error("createPerformance:", error);
    if (error?.code === "23505") { res.status(409).json({ message: "This player already has a performance for this match" }); return; }
    if (error?.code === "23503") { res.status(400).json({ message: "Invalid player or match" }); return; }
    res.status(500).json({ message: "Unable to create performance" });
  }
}

export async function updatePerformance(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) { res.status(400).json({ message: "Invalid performance ID" }); return; }
  try {
    const columns = editableColumns.filter((column) => req.body[column] !== undefined);
    if (!columns.length) { res.status(400).json({ message: "No fields supplied" }); return; }
    const values = columns.map((column) => req.body[column] === "" ? null : req.body[column]);
    const sets = columns.map((column, index) => `${column} = $${index + 1}`);
    values.push(id as never);
    const result = await pool.query(
      `UPDATE performances SET ${sets.join(", ")} WHERE id = $${values.length} RETURNING *`, values
    );
    if (!result.rowCount) { res.status(404).json({ message: "Performance not found" }); return; }
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error("updatePerformance:", error);
    if (error?.code === "23505") { res.status(409).json({ message: "This player already has a performance for this match" }); return; }
    res.status(500).json({ message: "Unable to update performance" });
  }
}

export async function deletePerformance(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) { res.status(400).json({ message: "Invalid performance ID" }); return; }
  try {
    const result = await pool.query("DELETE FROM performances WHERE id = $1 RETURNING id", [id]);
    if (!result.rowCount) { res.status(404).json({ message: "Performance not found" }); return; }
    res.status(204).send();
  } catch (error) {
    console.error("deletePerformance:", error);
    res.status(500).json({ message: "Unable to delete performance" });
  }
}
