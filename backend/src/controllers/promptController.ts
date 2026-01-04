import { type Request, type Response } from "express";
import { analyzePromptWithAI } from "../services/ai/analyzePrompt.ts";
import { getAllIntentsService } from "../services/intentService.ts";
import prisma from "../db.ts";
import { Prisma } from "@prisma/client";

const getPrompt = async (req: Request, res: Response) => {
  try {
    const { prompt, userId, activeIntentId } = req.body;

    if (!prompt || prompt.trim() === "") {
      return res.status(400).json({ error: "prompt is required" });
    }

    if (!userId || typeof userId !== "string") {
      return res.status(400).json({ error: "userId is required" });
    }

    // 0) Check for pending proposal confirmation if scoped
    if (activeIntentId) {
      const activeIntent = await prisma.intent.findUnique({
        where: { id: activeIntentId },
      });

      if (activeIntent?.pendingProposal) {
        const isConfirmation = /yes|confirm|ok|sure|do it|proceed/i.test(
          prompt
        );
        const isRejection = /no|cancel|stop|don't/i.test(prompt);

        if (isConfirmation) {
          const proposal = activeIntent.pendingProposal as any;
          // Execute the stored proposal
          await executePlan(proposal, userId, "Confirmed proposal");

          // Clear proposal
          await prisma.intent.update({
            where: { id: activeIntentId },
            data: { pendingProposal: Prisma.DbNull },
          });

          // Log system message
          await prisma.intentChat.create({
            data: {
              intentId: activeIntentId,
              role: "system",
              content: "Action executed successfully.",
            },
          });

          // Return updated state
          // We need to fetch the updated intent to return it
          const updatedIntent = await prisma.intent.findUnique({
            where: { id: activeIntentId },
            include: { tasks: true },
          });

          return res.status(200).json({
            action: "update",
            message: "Action executed.",
            intents: [updatedIntent],
          });
        } else if (isRejection) {
          await prisma.intent.update({
            where: { id: activeIntentId },
            data: { pendingProposal: Prisma.DbNull },
          });
          await prisma.intentChat.create({
            data: {
              intentId: activeIntentId,
              role: "system",
              content: "Action cancelled.",
            },
          });
          return res
            .status(200)
            .json({ action: "chat", message: "Action cancelled." });
        }

        // If ambiguous, clear proposal and treat as new prompt
        await prisma.intent.update({
          where: { id: activeIntentId },
          data: { pendingProposal: Prisma.DbNull },
        });
      }
    }

    // 1) Load existing intents + tasks for this user
    const allIntents = await getAllIntentsService(userId);

    let contextIntents = allIntents;

    if (activeIntentId) {
      const active = allIntents.find((i) => i.id === activeIntentId);
      if (active) {
        contextIntents = [active];
      }
    } else {
      const pendingIntent = allIntents.find(
        (i) => i.status === "CLARIFICATION_REQUESTED"
      );
      if (pendingIntent) {
        contextIntents = [pendingIntent];
      }
    }

    // 2) Ask the AI to analyze prompt + context
    const aiPlan = await analyzePromptWithAI(
      prompt,
      JSON.stringify(contextIntents),
      activeIntentId // Pass the scope if present
    );

    // 3) Handle Scoped vs Global Logic
    if (activeIntentId) {
      // Save user message
      await prisma.intentChat.create({
        data: { intentId: activeIntentId, role: "user", content: prompt },
      });

      if (aiPlan.action === "update" || aiPlan.action === "delete") {
        // Create Proposal
        await prisma.intent.update({
          where: { id: activeIntentId },
          data: { pendingProposal: aiPlan },
        });

        const msg = `I suggest executing this action (${aiPlan.action}). Do you want to proceed?`;

        await prisma.intentChat.create({
          data: { intentId: activeIntentId, role: "system", content: msg },
        });

        return res.status(200).json({ action: "ask", message: msg });
      }

      if (aiPlan.action === "chat" || aiPlan.action === "ask") {
        await prisma.intentChat.create({
          data: {
            intentId: activeIntentId,
            role: "system",
            content: aiPlan.message || "...",
          },
        });
        return res.status(200).json(aiPlan);
      }

      // If 'get', it might be a status check, just return info
      if (aiPlan.action === "get") {
        const msg = aiPlan.message || "Here is the current status.";
        await prisma.intentChat.create({
          data: { intentId: activeIntentId, role: "system", content: msg },
        });
        return res.status(200).json(aiPlan);
      }
    }

    // Global execution (Right Chat)
    const result = await executePlan(aiPlan, userId, prompt);

    return res.status(200).json(result);
  } catch (error) {
    console.error("getPrompt error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

async function executePlan(plan: any, userId: string, thoughtContent: string) {
  const { action, intents, message } = plan;

  // Make sure the user has a Thought record for this prompt
  const thought = await prisma.thought.create({
    data: {
      content: thoughtContent,
      userId,
    },
  });

  if (action === "ask") {
    // Persist the question so we remember context for the next turn
    // If the AI identified a specific intent to clarify, update or create it.
    // If no intent structure returned, create a placeholder.

    const targetIntent = intents && intents.length > 0 ? intents[0] : null;

    if (targetIntent && targetIntent.id) {
      // Update existing intent to mark as pending clarification
      await prisma.intent.update({
        where: { id: targetIntent.id, userId },
        data: {
          status: "CLARIFICATION_REQUESTED",
          pendingQuestion: message,
        },
      });
    } else {
      // Create a new intent in clarification state
      await prisma.intent.create({
        data: {
          type: targetIntent?.title || "New Intent (Clarification Needed)",
          status: "CLARIFICATION_REQUESTED",
          pendingQuestion: message,
          thoughtId: thought.id,
          userId,
        },
      });
    }
    return plan;
  }

  if (action === "create") {
    const createdIntents = [];

    for (const intent of intents || []) {
      const createdIntent = await prisma.intent.create({
        data: {
          type: intent.title,
          status: "ACTIVE", // Ensure it's active
          pendingQuestion: null, // Clear any pending question
          thoughtId: thought.id,
          userId,
          tasks: {
            create: (intent.tasks || []).map((task: any) => ({
              title: task.title,
              done: task.status === "completed",
              priority: task.priority ?? null,
            })),
          },
        },
        include: { tasks: true },
      });
      createdIntents.push(createdIntent);
    }

    return { ...plan, intents: createdIntents };
  }

  if (action === "update") {
    const updatedIntents = [];

    for (const intent of intents || []) {
      if (!intent.id) continue;

      const updates: any = {};
      if (intent.title) {
        updates.type = intent.title;
      }

      // Handle task deletions if explicitly requested or implied?
      // For now, we only upsert. To delete, the AI must use 'delete' action or we need a smarter diff.
      // But the user issue is about renaming.
      // The code above: updates.type = intent.title; should work IF intent.title is present.

      const updatedIntent = await prisma.intent.update({
        where: { id: intent.id, userId },
        data: {
          ...updates,
          status: "ACTIVE",
          pendingQuestion: null,
          tasks: {
            upsert: (intent.tasks || []).map((task: any) => ({
              where: {
                id:
                  task.id && task.id.length > 10
                    ? task.id
                    : "new-task-" + Math.random(),
              }, // Hacky check for valid ID
              update: {
                title: task.title,
                done: task.status === "completed",
                priority: task.priority ?? null,
              },
              create: {
                title: task.title,
                done: task.status === "completed",
                priority: task.priority ?? null,
              },
            })),
          },
        },
        include: { tasks: true },
      });

      updatedIntents.push(updatedIntent);
    }

    return { ...plan, intents: updatedIntents };
  }

  if (action === "get") {
    // If the AI identified specific intents to focus on, return ONLY those.
    // This allows the frontend to switch focus.
    if (intents && intents.length > 0) {
      const targetIds = intents.map((i: any) => i.id).filter(Boolean);
      if (targetIds.length > 0) {
        const targetIntents = await prisma.intent.findMany({
          where: {
            userId,
            id: { in: targetIds },
          },
          include: { tasks: true },
        });
        return { ...plan, intents: targetIntents };
      }
    }

    // Fallback: If no specific intent identified, return all (or maybe none?)
    // For "what are my intents?", returning all is correct.
    const dbIntents = await prisma.intent.findMany({
      where: { userId },
      include: { tasks: true },
    });
    return { ...plan, intents: dbIntents };
  }

  if (action === "delete") {
    for (const intent of intents || []) {
      // If tasks are specified, delete ONLY those tasks
      if (intent.tasks && intent.tasks.length > 0) {
        for (const task of intent.tasks) {
          if (task.id) {
            await prisma.task.deleteMany({ where: { id: task.id } });
          }
        }
      }
      // If no tasks specified, delete the ENTIRE intent (and its tasks first)
      else if (intent.id) {
        // Delete associated tasks first to avoid FK violation
        await prisma.task.deleteMany({ where: { intentId: intent.id } });
        // Delete the intent
        await prisma.intent.deleteMany({ where: { id: intent.id, userId } });
      }
    }
    return plan;
  }

  return plan;
}

export { getPrompt };
