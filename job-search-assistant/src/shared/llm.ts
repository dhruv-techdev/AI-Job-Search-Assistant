import OpenAI from "openai";
import dotenv from "dotenv";
import { logger } from "./logger.js";

dotenv.config();

let client: OpenAI | null = null;

/**
 * Lazily constructs the OpenRouter client so missing credentials surface as a
 * clear, actionable message instead of a stack trace at import time.
 */
function getClient(): OpenAI {
  if (client) return client;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY is not set. Add it to job-search-assistant/.env\n" +
      "  Example:  OPENROUTER_API_KEY=sk-or-v1-...\n" +
      "  Get a free key at https://openrouter.ai/keys"
    );
  }

  client = new OpenAI({ baseURL: "https://openrouter.ai/api/v1", apiKey });
  return client;
}

export const MODELS = {
  primary: "openai/gpt-oss-20b:free",
  secondary: "google/gemma-4-31b-it:free",
  creative: "nvidia/nemotron-3-super-120b-a12b:free",
  fast: "nvidia/nemotron-nano-9b-v2:free",
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
    const response = await getClient().chat.completions.create({
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

  // Validate credentials once up front so a missing key fails fast with a clear
  // message instead of being retried across every model.
  getClient();

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

  const trimmed = raw.trim();
  const firstChar = trimmed[0];

  // Array-first: response clearly starts with [
  if (firstChar === "[") {
    const bracketMatch = trimmed.match(/^\[[\s\S]*\]/);
    if (bracketMatch) return bracketMatch[0];

    // Truncated — salvage complete objects
    const objects: string[] = [];
    const objRegex = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)?\}/g;
    let match: RegExpExecArray | null;
    while ((match = objRegex.exec(trimmed)) !== null) {
      try { JSON.parse(match[0]); objects.push(match[0]); } catch { /* skip */ }
    }
    if (objects.length > 0) return `[${objects.join(",")}]`;
  }

  // Object-first for everything else
  const braceMatch = trimmed.match(/\{[\s\S]*\}/);
  if (braceMatch) return braceMatch[0];

  const bracketMatch = trimmed.match(/\[[\s\S]*\]/);
  if (bracketMatch) return bracketMatch[0];

  return trimmed;
}

/**
 * Repairs the malformed JSON free models commonly emit: raw control characters
 * inside string literals, an unterminated trailing string, a trailing comma,
 * and unclosed brackets from a truncated response. Best-effort — walks the
 * string tracking quote/escape state and a bracket stack, then closes anything
 * left open so the result has a chance of parsing.
 */
function repairJSON(input: string): string {
  let out = "";
  let inStr = false;
  let escaped = false;
  const stack: string[] = [];

  for (const ch of input) {
    if (inStr) {
      if (escaped) { out += ch; escaped = false; continue; }
      if (ch === "\\") { out += ch; escaped = true; continue; }
      if (ch === '"') { out += ch; inStr = false; continue; }
      if (ch === "\n") { out += "\\n"; continue; }
      if (ch === "\r") { out += "\\r"; continue; }
      if (ch === "\t") { out += "\\t"; continue; }
      out += ch;
      continue;
    }
    if (ch === '"') { inStr = true; out += ch; continue; }
    if (ch === "{" || ch === "[") { stack.push(ch); out += ch; continue; }
    if (ch === "}" || ch === "]") {
      stack.pop();
      out = out.replace(/,\s*$/, ""); // drop a trailing comma before this close
      out += ch;
      continue;
    }
    out += ch;
  }

  if (inStr) out += '"';            // close an unterminated string
  out = out.replace(/,\s*$/, "");   // drop a dangling trailing comma
  while (stack.length) {            // close brackets left open by truncation
    out += stack.pop() === "{" ? "}" : "]";
  }
  return out;
}

/**
 * Extracts and parses JSON from a raw LLM response, attempting a repair pass
 * before giving up. Throws a SyntaxError that includes the parser message and
 * the tail of the payload (where truncation shows up) for real diagnostics.
 */
export function parseJSONLoose(raw: string): unknown {
  const jsonStr = extractJSON(raw);
  try {
    return JSON.parse(jsonStr);
  } catch {
    try {
      return JSON.parse(repairJSON(jsonStr));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new SyntaxError(`${msg} | tail: …${jsonStr.slice(-160)}`);
    }
  }
}
