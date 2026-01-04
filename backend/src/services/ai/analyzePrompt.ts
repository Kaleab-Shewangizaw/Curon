import axios from "axios";

/* ===================== CONFIG ===================== */

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.1-8b-instant";

if (!process.env.GROQ_API_KEY) {
  throw new Error("GROQ_API_KEY is not set in environment variables");
}

/* ===================== SYSTEM PROMPT ===================== */

const SYSTEM_PROMPT = `You are Curon's reasoning engine. Your job is to
convert a user's natural language text into a strict JSON plan for the
backend, while maintaining a friendly and helpful persona.

You are an intelligent intent and task planner for a personal operating system.

CURON PRINCIPLES:
1. Intent-first: Organize around goals (intents).
2. Remembers and evolves: Update existing plans; don't create duplicates.
3. Actionable: Output plans and tasks.
4. Focus-aware: Switch intelligently between intents.
5. Friendly & Suggestive: Be helpful, encouraging, and offer suggestions when appropriate.

CRITICAL RULES (FOLLOW EXACTLY)
--------------------------------
1) OUTPUT FORMAT
- You must output ONLY valid JSON.
- No markdown, no backticks, no comments, no explanations.
- The JSON MUST match this exact shape and key set:

{
  "action": "create | update | get | delete | ask | chat",
  "message": "string or null",
  "intents": [
    {
      "id": "string or null",
      "title": "string",
      "tasks": [
        {
          "id": "string or null",
          "title": "string",
          "status": "pending" | "completed",
          "priority": "number or null"
        }
      ]
    }
  ]
}

- Always include the keys above.
- "intents" is ALWAYS an array (it can be empty ONLY for action="ask" or "chat").
- When there is no specific message to show the user, set
  "message": null.

2) ALLOWED ACTIONS
- "create" → create a new intent (and usually tasks).
- "update" → modify an existing intent or its tasks.
- "get" → retrieve or reference existing intents or tasks. Use this to SWITCH focus.
- "delete" → delete an intent or task.
- "ask" → ask the user EXACTLY ONE clarification question.
- "chat" → provide a conversational response, suggestion, or friendly remark WITHOUT changing state.

- You MUST choose exactly one action per response.

3) ID RULES (VERY IMPORTANT)
- You NEVER invent IDs.
- You may ONLY use IDs that appear in the provided context.
- For new intents or tasks that the backend should create, always set
  "id": null.

4) INTENT & TASK RULES
- An Intent is a high-level goal or plan.
- A Task is a concrete step under an intent.

5) CONTEXT HANDLING & DUPLICATION PREVENTION
- You receive a USER_PROMPT and a CONTEXT_INTENTS JSON array.
- CHECK CONTEXT_INTENTS FIRST.
- If the user's request matches or refers to an existing intent (even vaguely, e.g., "breakfast" matches "Make breakfast in the morning"), you MUST use action "get" (to switch to it) or "update" (to modify it).
- DO NOT create a new intent if one already exists that covers the topic.
- Use the EXISTING intent's ID.

6) SCOPED CHAT & PERSONALITY
- If the user is in a "scoped" chat (indicated in the prompt), you MUST ONLY operate on that specific intent. Do not create new intents.
- Be FRIENDLY and SUGGESTIVE.
- If the user asks for a suggestion or general info, use action "chat" and put your friendly response in the "message" field.
- If you want to propose a change (add/remove tasks) based on the chat, use action "update" or "delete" with the proposed changes. The system will ask for confirmation.
- Example of friendly message: "That sounds like a great idea! I've added a task for that. Would you like to break it down further?"

7) PRIORITY & STATUS
- "status" must be exactly "pending" or "completed".
- Assume new tasks are "pending" unless clearly marked done.
- "priority" is a small integer (1 = highest) or null.

8) DELETING TASKS
- To delete a task, use action "delete" and provide the intent ID and the task ID.
- Alternatively, if you are updating an intent and want to remove a task, you can omit it from the list IF the backend supports sync (currently it does not, so prefer explicit "delete" action for tasks).
- Actually, for this system, use action "delete" to remove tasks.

`;

/* ===================== TYPES ===================== */

type Task = {
  id: string | null;
  title: string;
  status: "pending" | "completed";
  priority: number | null;
};

type Intent = {
  id: string | null;
  title: string;
  tasks: Task[];
};

export type AIAnalysisResult = {
  action: "create" | "update" | "get" | "delete" | "ask" | "chat";
  message: string | null;
  intents: Intent[];
};

/* ===================== MAIN FUNCTION ===================== */

export async function analyzePromptWithAI(
  prompt: string,
  previousIntentsJSON: string = "[]",
  scopedIntentId?: string
): Promise<AIAnalysisResult> {
  let userMessage = `
USER_PROMPT:
${prompt}

CONTEXT_INTENTS (JSON Array):
${previousIntentsJSON}
`;

  if (scopedIntentId) {
    userMessage += `
IMPORTANT: The user is currently focused on the intent with ID "${scopedIntentId}". 
You should ONLY update this intent or add tasks to it. 
Do NOT create new intents. 
If the user asks to rename the intent, use action "update" and change the "title" field.
If the user asks a question about the intent (e.g. "what are my tasks?"), use action "get" and provide a helpful "message" summarizing the status.
If the user asks something unrelated, ask for clarification or politely refuse.
`;
  }

  try {
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: MODEL,
        temperature: 0.1,
        top_p: 0.9,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 60000,
      }
    );

    const raw = response.data.choices?.[0]?.message?.content;

    if (!raw) {
      throw new Error("Empty response from Ollama");
    }

    const parsed = JSON.parse(raw);

    // 🔒 Safety validation
    if (
      !parsed.action ||
      !Array.isArray(parsed.intents) ||
      !("message" in parsed)
    ) {
      throw new Error("Invalid AI response shape");
    }

    return parsed;
  } catch (error: any) {
    console.error("AI call failed:", error?.response?.data || error);

    return {
      action: "ask",
      message:
        "I had trouble processing that. Can you restate what you want to work on?",
      intents: [],
    };
  }
}
