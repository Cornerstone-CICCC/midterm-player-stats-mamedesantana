import express from "express";
import cors from "cors";
import performanceRoutes from "./routes/performanceRoutes.js";
import lookupRoutes from "./routes/lookupRoutes.js";
import rankingRoutes from "./routes/rankingRoutes.js";

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? "http://localhost:4321" }));
app.use(express.json());
app.get("/", (_req, res) =>
  res.json({ message: "Player Performance API is running" }),
);
app.use("/api/performances", performanceRoutes);
app.use("/api", lookupRoutes);
app.use("/api/rankings", rankingRoutes);
app.use((_req, res) => res.status(404).json({ message: "Route not found" }));
export default app;
