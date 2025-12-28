type AIIntentResult = {
  type: string;
  confidence?: number;
  tasks: {
    title: string;
    priority?: number;
  }[];
};

export type AIAnalysisResult = {
  intents: AIIntentResult[];
};

export async function analyzeThoughtWithAI(
  content: string,
  topic?: string
): Promise<AIAnalysisResult> {
  // AI logic will go here
  return {
    intents: [],
  };
}
