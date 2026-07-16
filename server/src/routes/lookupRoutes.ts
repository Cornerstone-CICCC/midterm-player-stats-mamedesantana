import { Router } from "express";
import { getFilters, getMatches, getPlayers } from "../controllers/lookupController.js";
const router = Router();
router.get("/players", getPlayers);
router.get("/matches", getMatches);
router.get("/filters", getFilters);
export default router;
