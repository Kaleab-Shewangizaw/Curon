import { Request, Response } from "express";

import prisma from "../db.ts";

const createIntent = async (req: Request, res: Response) => {
  const { type, description, thoughtId, userId } = req.body;
  try {
    if (!type || type.trim() === "") {
      return res.status(400).json({ error: "Type is required" });
    }

    const intent = await prisma.intent.create({
      data: {
        type,
        description,
        thoughtId,
        userId,
      },
    });
    res.status(201).json(intent);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

const deleteIntent = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const intent = await prisma.intent.delete({
      where: { id: String(id) },
    });
    res.status(200).json({ intent, message: "Intent deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

const updateIntent = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { type, description } = req.body;
  try {
    const intent = await prisma.intent.update({
      where: { id: String(id) },
      data: { type, description },
    });
    res.status(200).json(intent);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// get intent

const getIntent = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const intent = await prisma.intent.findUnique({
      where: { id: String(id) },
    });
    if (!intent) {
      return res.status(404).json({ error: "Intent not found" });
    }
    res.status(200).json(intent);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

const getThoughtIntents = async (req: Request, res: Response) => {
  const { thoughtId } = req.params;
  try {
    const intents = await prisma.intent.findMany({
      where: { thoughtId: String(thoughtId) },
    });
    res.status(200).json(intents);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export {
  createIntent,
  deleteIntent,
  updateIntent,
  getIntent,
  getThoughtIntents,
};
