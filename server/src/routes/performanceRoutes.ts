import { Router } from "express";
import { createPerformance, deletePerformance, getPerformanceById, getPerformances, updatePerformance } from "../controllers/performanceController.js";
const router = Router();
router.get("/", getPerformances);
router.get("/:id", getPerformanceById);
router.post("/", createPerformance);
router.put("/:id", updatePerformance);
router.delete("/:id", deletePerformance);
export default router;
