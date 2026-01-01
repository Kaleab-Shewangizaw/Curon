import { type Request, type Response } from "express";

import prisma from "../db.ts";

const createThought = async (req: Request, res: Response) => {
  const { content, userId } = req.body;
  try {
    if (!content || content.trim() === "") {
      return res.status(400).json({ error: "Content is required" });
    }

    const thought = await prisma.thought.create({
      data: {
        content,
        userId,
      },
    });
    res.status(201).json(thought);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

const deleteThought = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const thought = await prisma.thought.delete({
      where: { id: String(id) },
    });
    res.status(200).json({ thought, message: "Thought deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

const updateThought = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { content, topic, source } = req.body;
  try {
    const thought = await prisma.thought.update({
      where: { id: String(id) },
      data: { content, topic, source },
    });
    res.status(200).json(thought);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// get thought

const getThought = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const thought = await prisma.thought.findUnique({
      where: { id: String(id) },
    });
    if (!thought) {
      return res.status(404).json({ error: "Thought not found" });
    }
    res.status(200).json(thought);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

const getAllThoughts = async (req: Request, res: Response) => {
  try {
    const thoughts = await prisma.thought.findMany();
    res.status(200).json(thoughts);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export {
  createThought,
  deleteThought,
  updateThought,
  getThought,
  getAllThoughts,
};
