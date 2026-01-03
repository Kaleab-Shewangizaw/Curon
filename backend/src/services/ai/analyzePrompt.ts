import axios from "axios";

const OLLAMA_URL = "http://localhost:11434/api/generate";

const SYSTEM_PROMPT = `
You are an AI assistant that analyzes user prompts and converts them into structured intents.

Your job:
- Understand the user's intent
- Decide the correct action
- Generate clear, human-readable intent names
- Generate tasks when needed

ACTIONS:
- "create": new intent that does NOT exist yet
- "get": retrieve existing intent(s)
- "update": modify existing intent(s)
- "delete": remove existing intent(s)

IMPORTANT RULES:
1. If action is "create":
   - DO NOT include "id"
   - "type" MUST be a clear, human-readable intent name
     (example: "Buy a new laptop", "Plan weekly study schedule")

2. If action is "get", "update", or "delete":
   - "id" IS REQUIRED
   - The intent MUST already exist in previous data

3. Always include a short friendly message to the user:
   - Field name: "message"
   - Max 50 words
   - Natural, conversational, supportive
   - No emojis

RESPONSE FORMAT (JSON ONLY):

{
  "action": "create | get | update | delete",
  "message": "short friendly response (max 50 words)",
  "intents": [
    {
      "id": "string (ONLY for get/update/delete)",
      "type": "clear human-readable intent name",
      "confidence": 0.0,
      "tasks": [
        { "title": "task title", "priority": 1 }
      ]
    }
  ]
}

CRITICAL:
- Output ONLY valid JSON
- No markdown
- No explanations
- Stop after JSON
`;

export async function analyzePromptWithAI(
  prompt: string,
  previousIntentsJSON: string = "[]"
) {
  const fullPrompt = `
SYSTEM:
${SYSTEM_PROMPT}

USER PROMPT:
"${prompt}"

PREVIOUS INTENTS:
${previousIntentsJSON}
`;

  const response = await axios.post(OLLAMA_URL, {
    model: "llama3.2:3b-instruct-q4_K_M",
    prompt: fullPrompt,
    stream: false,
    temperature: 0.2,
    top_p: 0.9,
  });

  try {
    return JSON.parse(response.data.response);
  } catch (error) {
    console.error("Raw AI output:", response.data.response);
    throw new Error("Failed to parse AI response as JSON");
  }
}
