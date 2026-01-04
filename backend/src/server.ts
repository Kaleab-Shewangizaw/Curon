import express from "express";
import prisma from "./db.ts";
import cors from "cors";
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
import {
  createIntent,
  deleteIntent,
  getAllIntents,
  updateIntent,
  getIntentChat,
} from "./controllers/intentConteroller.ts";
import {
  createTask,
  deleteTask,
  updateTask,
} from "./controllers/taskController.ts";
import { getPrompt } from "./controllers/promptController.ts";

const app = express();

//cors

app.use(
  cors({
    origin: "http://localhost:3000",
  })
);
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
app.post("/getPrompt", getPrompt);

// Intent Routes
app.get("/getIntents/:userId", getAllIntents);
app.get("/getIntentChat/:intentId", getIntentChat);
app.post("/createIntent", createIntent);
app.delete("/deleteIntent/:id", deleteIntent);
app.put("/updateIntent/:id", updateIntent);

// Task Routes
app.post("/createTask", createTask);
app.delete("/deleteTask/:id", deleteTask);
app.put("/updateTask/:id", updateTask);

app.post("/createThought", createThought);
app.delete("/deleteThought/:id", deleteThought);
app.put("/updateThought/:id", updateThought);
app.get("/getThought/:id", getThought);

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});

//  user1: {
// 	"id": "cmjynnuyj0000ftfariqgmngm",
// 	"email": "curon1@gmail.com",
// 	"name": "curon_1",
// 	"password": "1234@curon",
// 	"createdAt": "2026-01-03T18:47:48.808Z"
// }
