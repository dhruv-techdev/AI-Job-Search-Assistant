import OpenAI from "openai";
import dotenv from "dotenv";
import { logger } from "./logger.js";

dotenv.config();

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "",
});

export const MODELS = {
  primary: "meta-llama/llama-3.3-70b-instruct:free",
  secondary: "nvidia/nemotron-3-super-120b-a12b:free",
  creative: "google/gemma-4-31b-it:free",
  fast: "meta-llama/llama-3.2-3b-instruct:free",
} as const;

export type ModelKey = keyof typeof MODELS;

export async function callLLM(
  prompt: string,
  options: {
    model?: ModelKey;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
  } = {}
): Promise<string> {
  const {
    model = "primary",
    systemPrompt = "You are a professional career analysis assistant. Always respond with valid JSON when asked.",
    temperature = 0.3,
    maxTokens = 4096,
    jsonMode = false,
  } = options;

  const modelId = MODELS[model];
  logger.debug(`Calling ${modelId}...`);

  try {
    const response = await client.chat.completions.create({
      model: modelId,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature,
      max_tokens: maxTokens,
      ...(jsonMode && { response_format: { type: "json_object" } }),
    });

    const content = response.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Empty response from LLM");
    }

    logger.debug(`Response received (${content.length} chars)`);
    return content;
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    logger.error(`LLM call failed with ${modelId}: ${errMsg}`);
    throw error;
  }
}

export async function callLLMWithRetry(
  prompt: string,
  options: {
    model?: ModelKey;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
    retries?: number;
    fallbackModels?: ModelKey[];
  } = {}
): Promise<string> {
  const {
    retries = 2,
    fallbackModels = ["secondary", "creative"],
    ...llmOptions
  } = options;

  const modelsToTry: ModelKey[] = [
    llmOptions.model || "primary",
    ...fallbackModels,
  ];

  for (const modelKey of modelsToTry) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await callLLM(prompt, { ...llmOptions, model: modelKey });
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        logger.warn(
          `Attempt ${attempt}/${retries} with ${MODELS[modelKey]} failed: ${errMsg}`
        );

        if (attempt < retries) {
          const delay = attempt * 2000;
          logger.info(`Retrying in ${delay / 1000}s...`);
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }
    logger.warn(`All retries exhausted for ${MODELS[modelKey]}, trying next model...`);
  }

  throw new Error("All models and retries exhausted");
}

export function extractJSON(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();

  const braceMatch = raw.match(/\{[\s\S]*\}/);
  if (braceMatch) return braceMatch[0].trim();

  const bracketMatch = raw.match(/\[[\s\S]*\]/);
  if (bracketMatch) return bracketMatch[0].trim();

  return raw.trim();
}
