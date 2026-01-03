import axios from "axios";

/* ===================== TYPES ===================== */

type Task = {
  title: string;
  priority?: number;
};

type AIIntentResult = {
  id?: string;
  type: string;
  confidence?: number;
  tasks: Task[];
};

export type AIAnalysisResult = {
  text: string;
  action: "create" | "get" | "update" | "delete";
  intents: AIIntentResult[];
};

/* ===================== CONFIG ===================== */

const OLLAMA_URL = "http://localhost:11434/api/generate";

const SYSTEM_PROMPT = `
You extract structured intents and tasks.

CRITICAL RULES:
- Output ONLY valid JSON
- No markdown
- No explanations
- Stop after JSON

LOGIC RULES:
- If the current thought matches a previous intent type exactly, action MUST be "get"
- If the current thought indicates modification of a previous intent, action MUST be "update"
- If the current thought indicates removal of a previous intent, action MUST be "delete"
- If the current thought is new and does not match any previous intent, action MUST be "create"

JSON SCHEMA RULES:
- Use "id" ONLY for actions: get, update, delete
- NEVER include "id" when action is "create"

Schema:

{
  "text": "short summary (max 20 words)/if there is same intent then tell that the user already mentioned this idea/intent before",
  "action": "create | get | update | delete",
  "intents": [  //could be multipe intents in one prompt so deparate them. if so, create multiple intents for each. with their respective tasks.  // if the action is delete/get/update, then the listed intents must exist in previous intents. Otherwise, for create, the intents must be new.
    {
      "id": "string (ONLY for get/update/delete)",
      "type": "clear intent name",
      "confidence": 0.0,
      "tasks": [
        { "title": "task title", "priority": 1 }
      ]
    }
  ]
}
`;

/* ===================== HELPERS ===================== */

function extractJSON(raw: string): string {
  const cleaned = raw.replace(/```(?:json)?/g, "").trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error("No JSON object found in AI response");
  }

  return cleaned.slice(firstBrace, lastBrace + 1);
}

function normalize(str: string) {
  return str.trim().toLowerCase();
}

/* ===================== AI FUNCTION ===================== */

export async function analyzeThoughtWithAI(
  content: string,
  previousIntents: AIIntentResult[]
): Promise<AIAnalysisResult> {
  const prompt = `
Previous intents:
${JSON.stringify(previousIntents, null, 2)}

User thought:
${content}
`;

  const response = await axios.post(
    OLLAMA_URL,
    {
      model: "llama3.2:3b-instruct-q4_K_M",
      prompt: `${SYSTEM_PROMPT}\n\n${prompt}`,
      stream: false,
      options: {
        temperature: 0.1,
        num_ctx: 4096,
        stop: ["```"],
      },
    },
    { timeout: 0 }
  );

  const raw = response.data?.response;
  if (!raw || !raw.trim()) {
    throw new Error("Empty AI response");
  }

  console.log("\nRAW AI RESPONSE:\n", raw);

  const parsed: AIAnalysisResult = JSON.parse(extractJSON(raw));

  /* ===================== ENFORCE CURON LOGIC ===================== */

  const intent = parsed.intents[0];
  if (!intent) return parsed;

  const match = previousIntents.find(
    (i) => normalize(i.type) === normalize(intent.type)
  );

  // CASE 1: Intent EXISTS
  if (match) {
    // Attach ID for valid actions
    if (
      parsed.action === "get" ||
      parsed.action === "update" ||
      parsed.action === "delete"
    ) {
      intent.id = match.id;
    }

    // AI mistakenly said "create" for an existing intent → downgrade to get
    if (parsed.action === "create") {
      parsed.action = "get";
      intent.id = match.id;
    }
  }

  // CASE 2: Intent DOES NOT EXIST
  else {
    // If AI tries to update/delete/get non-existing intent → force create
    if (parsed.action !== "create") {
      parsed.action = "create";
    }

    // Ensure no ID leakage
    delete intent.id;
  }

  return parsed;
}

/* ===================== TEMP TEST ===================== */

// const previousIntents: AIIntentResult[] = [
//   {
//     id: "1",
//     type: "Buy a new laptop",
//     confidence: 0.95,
//     tasks: [
//       { title: "Research laptop models", priority: 8 },
//       { title: "Compare prices", priority: 7 },
//     ],
//   },
// ];

// const thought =
//   "I have to start going to the gym regularly. and I am thinking of learning to play guitar.";

// analyzeThoughtWithAI(thought, previousIntents)
//   .then((result) => {
//     console.log("\nAI Analysis Result:");
//     console.dir(result, { depth: null });
//   })
//   .catch(console.error);
