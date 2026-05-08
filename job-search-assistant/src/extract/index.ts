import dotenv from "dotenv";
import path from "path";
import ora from "ora";
import { logger } from "../shared/logger.js";
import {
  scanForPDFs,
  isAlreadyProcessed,
  getJobJSONPath,
  saveJSON,
  ensureDirectories,
  PATHS,
} from "../shared/tools.js";
import { extractTextFromPDF } from "../shared/pdf.js";
import { callLLMWithRetry, extractJSON } from "../shared/llm.js";
import { JobPostingSchema, type JobPosting } from "../shared/types.js";
import { buildJobExtractionPrompt } from "./prompts.js";
import { researchCompany } from "./company-research.js";

dotenv.config();

interface MarketOptions {
  force?: boolean;
  verbose?: boolean;
}

/**
 * Extracts structured job data from a single PDF using LLM + Zod validation,
 * then enriches with company research.
 */
async function extractJobPosting(pdfPath: string): Promise<JobPosting> {
  const fileName = path.basename(pdfPath);

  // 1. Extract text from PDF
  const text = await extractTextFromPDF(pdfPath);
  logger.debug(`  Extracted ${text.length} chars from PDF`);

  // 2. Build prompt and call LLM
  const prompt = buildJobExtractionPrompt(text, fileName);
  const rawResponse = await callLLMWithRetry(prompt, {
    model: "primary",
    temperature: 0.1,
    maxTokens: 4096,
    jsonMode: true,
    fallbackModels: ["secondary"],
  });

  // 3. Parse JSON from response
  const jsonStr = extractJSON(rawResponse);
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error(`LLM returned invalid JSON for ${fileName}:\n${jsonStr.substring(0, 300)}`);
  }

  // 4. Validate with Zod schema
  const result = JobPostingSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Schema validation failed for ${fileName}:\n${issues}`);
  }

  // 5. Enrich with company research
  const jobData = result.data;
  if (jobData.companyName) {
    const research = await researchCompany(jobData.companyName);
    jobData.companyResearch = research;
  }

  return jobData;
}

export async function runMarketAnalysis(options: MarketOptions = {}): Promise<void> {
  logger.info("=== Market Analysis Workflow ===");
  ensureDirectories();

  // Step 1: Scan for PDFs
  const pdfFiles = scanForPDFs(PATHS.postings);
  if (pdfFiles.length === 0) {
    logger.error("No PDF files found. Add job posting PDFs to the postings/ folder.");
    return;
  }

  // Step 2: Filter already processed (unless force)
  const toProcess: string[] = [];
  const skipped: string[] = [];

  for (const pdfPath of pdfFiles) {
    if (!options.force && isAlreadyProcessed(pdfPath)) {
      skipped.push(path.basename(pdfPath));
      continue;
    }
    toProcess.push(pdfPath);
  }

  if (skipped.length > 0) {
    logger.info(`Skipping ${skipped.length} already processed file(s). Use --force to reprocess.`);
  }

  if (toProcess.length === 0) {
    logger.info("All job postings already processed.");
    // TODO: Continue to market analysis generation (future story)
    return;
  }

  logger.info(`Processing ${toProcess.length} job posting(s)...\n`);

  // Step 3: Extract each posting
  let successCount = 0;
  let failCount = 0;
  const failures: { file: string; error: string }[] = [];

  for (let i = 0; i < toProcess.length; i++) {
    const pdfPath = toProcess[i];
    const fileName = path.basename(pdfPath);
    const spinner = ora(`[${i + 1}/${toProcess.length}] ${fileName}`).start();

    try {
      const jobData = await extractJobPosting(pdfPath);

      // Save validated JSON
      const outputPath = getJobJSONPath(pdfPath);
      saveJSON(outputPath, jobData);

      spinner.succeed(`[${i + 1}/${toProcess.length}] ${jobData.jobTitle} at ${jobData.companyName}`);
      logger.info(`  Skills: ${jobData.requiredSkills.slice(0, 5).join(", ")}${jobData.requiredSkills.length > 5 ? "..." : ""}`);
      if (jobData.companyResearch?.companySize) {
        logger.info(`  Company: ${jobData.companyResearch.companySize}`);
      }
      if (jobData.companyResearch && jobData.companyResearch.cultureSignals.length > 0) {
        logger.info(`  Culture: ${jobData.companyResearch.cultureSignals.join(", ")}`);
      }
      logger.info(`  Saved: ${outputPath}`);
      successCount++;
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      spinner.fail(`[${i + 1}/${toProcess.length}] ${fileName} — FAILED`);
      logger.error(`  ${errMsg}`);
      failures.push({ file: fileName, error: errMsg });
      failCount++;
    }

    console.log();
  }

  // Summary
  logger.info("=== Extraction Summary ===");
  logger.info(`Total PDFs found:  ${pdfFiles.length}`);
  logger.info(`Skipped (cached):  ${skipped.length}`);
  logger.success(`Extracted:         ${successCount}`);
  if (failCount > 0) {
    logger.error(`Failed:            ${failCount}`);
    for (const f of failures) {
      logger.error(`  - ${f.file}: ${f.error.split("\n")[0]}`);
    }
  }

  // TODO: Generate market analysis from extracted data (future story)
  logger.warn("Market analysis generation not yet implemented.");
  logger.success("Extraction workflow completed.");
}

// Direct execution support
const isDirectRun = process.argv[1]?.endsWith("extract/index.ts") ||
                    process.argv[1]?.endsWith("extract/index.js");
if (isDirectRun) {
  runMarketAnalysis();
}
