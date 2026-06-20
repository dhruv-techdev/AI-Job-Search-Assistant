import dotenv from "dotenv";
import fs from "fs";
import ora from "ora";
import path from "path";
import { logger } from "../shared/logger.js";
import { validatePDFFile, saveJSON, ensureDirectories, PATHS } from "../shared/tools.js";
import { extractTextFromPDF } from "../shared/pdf.js";
import { callLLMWithRetry, parseJSONLoose } from "../shared/llm.js";
import { ResumeSchema, type Resume } from "../shared/types.js";
import { buildResumeExtractionPrompt } from "./prompts.js";
import {
  loadRequiredFiles,
  generateGapAnalysis,
  saveGapAnalysis,
  generateGapReport,
} from "./gap-analysis.js";

dotenv.config();

interface GapOptions {
  verbose?: boolean;
}

/**
 * Extracts structured resume data from a PDF using LLM + Zod validation.
 */
async function extractResume(resumePath: string): Promise<Resume> {
  const validation = validatePDFFile(resumePath);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const text = await extractTextFromPDF(resumePath);
  logger.debug(`Extracted ${text.length} chars from resume`);

  const prompt = buildResumeExtractionPrompt(text);
  const rawResponse = await callLLMWithRetry(prompt, {
    model: "primary",
    temperature: 0.1,
    maxTokens: 16384,
    jsonMode: true,
    fallbackModels: ["secondary"],
  });

  let parsed: unknown;
  try {
    parsed = parseJSONLoose(rawResponse);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(`LLM returned invalid JSON for resume: ${detail}`);
  }

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
    logger.error("Usage: npm run gaps -- <path-to-resume.pdf>");
    process.exit(1);
  }

  if (!fs.existsSync(resumePath)) {
    logger.error(`Resume file not found: ${resumePath}`);
    process.exit(1);
  }

  // Step 2: Extract resume
  const spinner = ora("Extracting resume data...").start();

  let resumeData: Resume;
  try {
    resumeData = await extractResume(resumePath);
    saveJSON(PATHS.resumeData, resumeData);
    spinner.succeed("Resume extracted and validated!");

    // Print summary
    console.log();
    logger.info("=== Resume Summary ===");
    logger.info(`Name: ${resumeData.candidateName}`);
    if (resumeData.email) logger.info(`Email: ${resumeData.email}`);
    if (resumeData.location) logger.info(`Location: ${resumeData.location}`);
    logger.info(`Hard Skills (${resumeData.hardSkills.length}): ${resumeData.hardSkills.slice(0, 8).join(", ")}${resumeData.hardSkills.length > 8 ? "..." : ""}`);
    logger.info(`Soft Skills (${resumeData.softSkills.length}): ${resumeData.softSkills.join(", ")}`);
    logger.info(`Work Experience: ${resumeData.workExperience.length} position(s)`);
    logger.info(`Education: ${resumeData.education.length} entry/entries`);
    logger.info(`Projects: ${resumeData.projects.length} project(s)`);
    logger.info(`Certifications: ${resumeData.certifications.length}`);
    console.log();
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    spinner.fail("Resume extraction failed");
    logger.error(errMsg);
    process.exit(1);
  }

  // Step 3: Check for market analysis
  if (!fs.existsSync(PATHS.marketAnalysis)) {
    logger.warn("Market analysis not found. Run 'npm run market' first.");
    logger.info("Resume extracted successfully — run market analysis to enable gap analysis.");
    return;
  }

  // Step 4: Generate gap analysis
  const gapSpinner = ora("Generating gap analysis...").start();

  try {
    const { market } = loadRequiredFiles();
    const gapAnalysis = await generateGapAnalysis(resumeData, market);

    saveGapAnalysis(gapAnalysis);
    generateGapReport(gapAnalysis, resumeData);

    gapSpinner.succeed("Gap analysis complete!");

    // Print summary
    console.log();
    logger.info("=== Gap Analysis Summary ===");
    logger.info(`Readiness Score: ${gapAnalysis.overallReadinessScore}/100`);
    logger.info(`Strengths: ${gapAnalysis.strengths.length}`);
    for (const s of gapAnalysis.strengths) {
      logger.info(`  ✓ ${s.skill}`);
    }
    logger.info(`Gaps: ${gapAnalysis.gaps.length}`);
    const quickWins = gapAnalysis.gaps.filter((g) => g.level === "quick_win");
    const shortTerm = gapAnalysis.gaps.filter((g) => g.level === "short_term");
    const medTerm = gapAnalysis.gaps.filter((g) => g.level === "medium_term");
    const longTerm = gapAnalysis.gaps.filter((g) => g.level === "long_term");
    if (quickWins.length > 0) logger.info(`  Quick wins: ${quickWins.map((g) => g.skill).join(", ")}`);
    if (shortTerm.length > 0) logger.info(`  Short-term: ${shortTerm.map((g) => g.skill).join(", ")}`);
    if (medTerm.length > 0) logger.info(`  Medium-term: ${medTerm.map((g) => g.skill).join(", ")}`);
    if (longTerm.length > 0) logger.info(`  Long-term: ${longTerm.map((g) => g.skill).join(", ")}`);
    logger.info(`Unique value: ${gapAnalysis.uniqueValuePoints.join("; ")}`);

    console.log();
    logger.success("Gap analysis workflow completed!");
    logger.info(`Reports: ${PATHS.gapAnalysis}`);
    logger.info(`         ${path.join(PATHS.reports, "gap-analysis.md")}`);
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    gapSpinner.fail("Gap analysis failed");
    logger.error(errMsg);
    process.exit(1);
  }
}

// Direct execution support
const isDirectRun = process.argv[1]?.endsWith("analysis/index.ts") ||
                    process.argv[1]?.endsWith("analysis/index.js");
if (isDirectRun) {
  const resumePath = process.argv[2];
  if (!resumePath) {
    logger.error("Usage: npm run gaps -- <path-to-resume.pdf>");
    process.exit(1);
  }
  runGapAnalysis(resumePath);
}
