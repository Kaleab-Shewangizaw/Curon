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
- Use "id" ONLY for actions: get, update, delete
- NEVER include "id" when action is "create"

Schema:

{
  "text": "short summary (max 20 words)/if there is same intent then tell that the user already mentioned this idea/intent before",
  "action": "create | get | update | delete",
  "intents": [
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

  if (match) {
    // FORCE get
    parsed.action = "get";
    intent.id = match.id;
  } else {
    // FORCE create
    parsed.action = "create";
    delete intent.id;
  }

  return parsed;
}

/* ===================== TEMP TEST ===================== */

const previousIntents: AIIntentResult[] = [
  {
    id: "1",
    type: "Buy a new laptop",
    confidence: 0.95,
    tasks: [
      { title: "Research laptop models", priority: 8 },
      { title: "Compare prices", priority: 7 },
    ],
  },
];

const thought =
  "I want to buy a new laptop because my current one is too slow. I need something lightweight.";

analyzeThoughtWithAI(thought, previousIntents)
  .then((result) => {
    console.log("\nAI Analysis Result:");
    console.dir(result, { depth: null });
  })
  .catch(console.error);
