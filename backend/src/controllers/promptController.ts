import { type Request, type Response } from "express";
import { analyzePromptWithAI } from "../services/ai/analyzePrompt.ts";
import { getAllIntentsService } from "../services/intentService.ts";

const getPrompt = async (req: Request, res: Response) => {
  console.log("getPrompt called");
  try {
    const { prompt } = req.body;

    if (!prompt || prompt.trim() === "") {
      return res.status(400).json({ error: "prompt is required" });
    }

    const previousIntents = await getAllIntentsService();

    const analysisResult = await analyzePromptWithAI(
      prompt,
      JSON.stringify(previousIntents)
    );

    return res.status(200).json(analysisResult);
  } catch (error) {
    console.error("getPrompt error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export { getPrompt };
