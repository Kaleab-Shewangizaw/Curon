import { type Request, type Response } from "express";
import prisma from "../db.ts";

export const createTask = async (req: Request, res: Response) => {
  const { title, intentId, priority } = req.body;

  if (!title || !intentId) {
    return res.status(400).json({ error: "Title and intentId are required" });
  }

  try {
    const task = await prisma.task.create({
      data: {
        title,
        intentId,
        priority: priority || null,
        done: false,
      },
    });
    res.status(201).json(task);
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateTask = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, done, priority } = req.body;

  try {
    const task = await prisma.task.update({
      where: { id },
      data: {
        title,
        done,
        priority,
      },
    });
    res.status(200).json(task);
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.task.delete({
      where: { id },
    });
    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
