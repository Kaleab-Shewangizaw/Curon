import express from "express";
import prisma from "./db";
import "dotenv/config";

const app = express();

app.use(express.json());

app.get("/health", async (_, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: "ok" });
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
