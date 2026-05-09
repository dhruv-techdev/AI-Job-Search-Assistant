import dotenv from "dotenv";
import fs from "fs";
import ora from "ora";
import { logger } from "../shared/logger.js";
import { validatePDFFile, saveJSON, ensureDirectories, PATHS } from "../shared/tools.js";
import { extractTextFromPDF } from "../shared/pdf.js";
import { callLLMWithRetry, extractJSON } from "../shared/llm.js";
import { ResumeSchema, type Resume } from "../shared/types.js";
import { buildResumeExtractionPrompt } from "./prompts.js";

dotenv.config();

interface GapOptions {
  verbose?: boolean;
}

/**
 * Extracts structured resume data from a PDF using LLM + Zod validation.
 */
async function extractResume(resumePath: string): Promise<Resume> {
  // ST-1: Validate the file
  const validation = validatePDFFile(resumePath);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // ST-2: Extract text from PDF
  const text = await extractTextFromPDF(resumePath);
  logger.debug(`Extracted ${text.length} chars from resume`);

  // ST-3: Build prompt and call LLM
  const prompt = buildResumeExtractionPrompt(text);
  const rawResponse = await callLLMWithRetry(prompt, {
    model: "primary",
    temperature: 0.1,
    maxTokens: 8192,
    fallbackModels: ["secondary"],
  });

  // Parse JSON from response
  const jsonStr = extractJSON(rawResponse);
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error(`LLM returned invalid JSON for resume:\n${jsonStr.substring(0, 300)}`);
  }

  // ST-4: Validate with Zod schema
  const result = ResumeSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Resume schema validation failed:\n${issues}`);
  }

  return result.data;
}

export async function runGapAnalysis(resumePath: string, options: GapOptions = {}): Promise<void> {
  logger.info("=== Gap Analysis Workflow ===");
  ensureDirectories();

  // Step 1: Validate resume path
  if (!resumePath) {
    logger.error("Usage: npm run gaps <path-to-resume.pdf>");
    process.exit(1);
  }

  if (!fs.existsSync(resumePath)) {
    logger.error(`Resume file not found: ${resumePath}`);
    logger.info("Provide the path to your resume PDF file.");
    process.exit(1);
  }

  // Step 2: Check if resume already extracted
  const existingResume = fs.existsSync(PATHS.resumeData);
  if (existingResume) {
    logger.info("Existing resume data found. Re-extracting from PDF...");
  }

  // Step 3: Extract resume
  const spinner = ora("Extracting resume data...").start();

  try {
    const resumeData = await extractResume(resumePath);

    // ST-5: Save resume JSON
    saveJSON(PATHS.resumeData, resumeData);
    spinner.succeed("Resume extracted and validated successfully!");

    // Print summary
    console.log();
    logger.info("=== Resume Summary ===");
    logger.info(`Name: ${resumeData.candidateName}`);
    if (resumeData.email) logger.info(`Email: ${resumeData.email}`);
    if (resumeData.location) logger.info(`Location: ${resumeData.location}`);
    logger.info(`Hard Skills (${resumeData.hardSkills.length}): ${resumeData.hardSkills.slice(0, 8).join(", ")}${resumeData.hardSkills.length > 8 ? "..." : ""}`);
    logger.info(`Soft Skills (${resumeData.softSkills.length}): ${resumeData.softSkills.join(", ")}`);
    logger.info(`Work Experience: ${resumeData.workExperience.length} position(s)`);
    for (const exp of resumeData.workExperience) {
      logger.info(`  - ${exp.title} at ${exp.company}${exp.duration ? ` (${exp.duration})` : ""}`);
    }
    logger.info(`Education: ${resumeData.education.length} entry/entries`);
    logger.info(`Projects: ${resumeData.projects.length} project(s)`);
    logger.info(`Certifications: ${resumeData.certifications.length}`);
    logger.info(`Keywords: ${resumeData.keywords.slice(0, 10).join(", ")}${resumeData.keywords.length > 10 ? "..." : ""}`);

    console.log();
    logger.success(`Resume saved: ${PATHS.resumeData}`);
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    spinner.fail("Resume extraction failed");
    logger.error(errMsg);
    process.exit(1);
  }

  // Step 4: Check if market analysis exists for gap analysis
  if (!fs.existsSync(PATHS.marketAnalysis)) {
    logger.warn("\nMarket analysis not found. Run 'npm run market' first to generate gap analysis.");
    logger.info("Resume extraction is complete — gap analysis will be available after market analysis.");
    return;
  }

  // TODO: Generate gap analysis (next story)
  logger.warn("\nGap analysis generation not yet implemented.");
  logger.success("Resume extraction workflow completed!");
}

// Direct execution support
const isDirectRun = process.argv[1]?.endsWith("analysis/index.ts") ||
                    process.argv[1]?.endsWith("analysis/index.js");
if (isDirectRun) {
  const resumePath = process.argv[2];
  if (!resumePath) {
    logger.error("Usage: npm run gaps <path-to-resume.pdf>");
    process.exit(1);
  }
  runGapAnalysis(resumePath);
}
