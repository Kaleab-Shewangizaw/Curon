import { type Request, type Response } from "express";

import prisma from "../db.ts";

const createUser = async (req: Request, res: Response) => {
  const { name, email } = req.body;
  try {
    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "Name is required" });
    }
    if (!email || email.trim() === "") {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: "user1234",
      },
    });
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.delete({
      where: { id: String(id) },
    });
    res.status(200).json({ user, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, email } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id: String(id) },
      data: { name, email },
    });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

const getUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { id: String(id) },
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

const getGroupOfUsers = async (req: Request, res: Response) => {
  const { ids } = req.body;
  try {
    const users = await prisma.user.findMany({
      where: {
        id: { in: ids },
      },
    });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export {
  createUser,
  deleteUser,
  updateUser,
  getUser,
  getAllUsers,
  getGroupOfUsers,
};
