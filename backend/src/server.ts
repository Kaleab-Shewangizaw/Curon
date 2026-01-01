import express from "express";
import prisma from "./db.ts";
import "dotenv/config";
import {
  createThought,
  deleteThought,
  getThought,
  updateThought,
} from "./controllers/thoughtControllers.ts";
import {
  createUser,
  deleteUser,
  getAllUsers,
  getGroupOfUsers,
  getUser,
  updateUser,
} from "./controllers/usersController.ts";

const app = express();

app.use(express.json());

app.get("/health", async (_, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: "ok" });
});

app.post("/createUser", createUser);
app.delete("/deleteUser/:id", deleteUser);
app.put("/updateUser/:id", updateUser);
app.get("/getUser/:id", getUser);
app.get("/getAllUsers", getAllUsers);
app.post("/getGroupOfUsers", getGroupOfUsers);

app.post("/createThought", createThought);
app.delete("/deleteThought/:id", deleteThought);
app.put("/updateThought/:id", updateThought);
app.get("/getThought/:id", getThought);

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
