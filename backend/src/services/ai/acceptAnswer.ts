import axios from "axios";

const OLLAMA_URL = "http://localhost:11434/api/generate";

const SYSTEM_PROMPT = ``;

export async function acceptAnswer(
  userAnswer: string,
  prompt: string,
  intentJSON: string
) {
  const fullPrompt = `
  SYSTEM: ${SYSTEM_PROMPT}
  
  USER ANSWER: ${userAnswer}
  
  CURRENT_INTENT: ${intentJSON} `;

  const response = await axios.post(OLLAMA_URL, {
    model: "llama3.2:3b-instruct-q4_K_M",
    prompt: fullPrompt,
    stream: false,
    temperature: 0.2,
    top_p: 0.9,
  });

  try {
    return JSON.parse(response.data.response);
  } catch (err) {
    console.error("RAW AI: ", response.data.response);
    throw new Error("FAILED WHEN REPLING TO THE USER!");
  }
}
