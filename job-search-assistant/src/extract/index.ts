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
import { callLLMWithRetry, parseJSONLoose } from "../shared/llm.js";
import { JobPostingSchema, type JobPosting } from "../shared/types.js";
import { buildJobExtractionPrompt } from "./prompts.js";
import { researchCompany } from "./company-research.js";
import { loadExtractedJobs, generateMarketAnalysis, saveMarketAnalysis } from "./market-analysis.js";
import { generateMarketReport } from "./market-report.js";

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
    maxTokens: 8192,
    fallbackModels: ["secondary"],
  });

  // 3. Parse JSON from response
  let parsed: unknown;
  try {
    parsed = parseJSONLoose(rawResponse);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(`LLM returned invalid JSON for ${fileName}: ${detail}`);
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
  // The resume lives in postings/ for the `gaps` command, so skip resume-like
  // files here — they aren't job postings and would fail extraction.
  const RESUME_LIKE = /resume|cv|curriculum/i;
  const pdfFiles = scanForPDFs(PATHS.postings).filter((p) => {
    if (RESUME_LIKE.test(path.basename(p))) {
      logger.info(`Skipping resume-like file (not a job posting): ${path.basename(p)}`);
      return false;
    }
    return true;
  });
  if (pdfFiles.length === 0) {
    logger.error("No job posting PDFs found in postings/ (resume files are skipped).");
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

  // Step 3: Extract new postings
  if (toProcess.length > 0) {
    logger.info(`Processing ${toProcess.length} job posting(s)...\n`);

    let successCount = 0;
    let failCount = 0;
    const failures: { file: string; error: string }[] = [];

    for (let i = 0; i < toProcess.length; i++) {
      const pdfPath = toProcess[i];
      const fileName = path.basename(pdfPath);
      const spinner = ora(`[${i + 1}/${toProcess.length}] ${fileName}`).start();

      try {
        const jobData = await extractJobPosting(pdfPath);
        const outputPath = getJobJSONPath(pdfPath);
        saveJSON(outputPath, jobData);

        spinner.succeed(`[${i + 1}/${toProcess.length}] ${jobData.jobTitle} at ${jobData.companyName}`);
        logger.info(`  Skills: ${jobData.requiredSkills.slice(0, 5).join(", ")}${jobData.requiredSkills.length > 5 ? "..." : ""}`);
        if (jobData.companyResearch?.companySize) {
          logger.info(`  Company: ${jobData.companyResearch.companySize}`);
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
    console.log();
  }

  // Step 4: Generate market analysis from ALL extracted jobs
  logger.info("=== Generating Market Analysis ===");
  const allJobs = loadExtractedJobs();

  if (allJobs.length === 0) {
    logger.error("No valid job postings to analyze.");
    return;
  }

  try {
    const analysis = generateMarketAnalysis(allJobs);
    saveMarketAnalysis(analysis);
    generateMarketReport(analysis);

    // Print summary
    console.log();
    logger.info("=== Market Analysis Summary ===");
    logger.info(`Postings analyzed: ${analysis.totalPostingsAnalyzed}`);
    logger.info(`Top 5 required skills:`);
    for (const s of analysis.topRequiredSkills.slice(0, 5)) {
      logger.info(`  - ${s.skill} (${s.percentage}% of postings)`);
    }
    logger.info(`Experience: Entry=${analysis.experienceLevels.entry}, Mid=${analysis.experienceLevels.mid}, Senior=${analysis.experienceLevels.senior}`);
    if (analysis.salaryRange) {
      logger.info(`Salary: ${analysis.salaryRange.currency || ""} ${analysis.salaryRange.min?.toLocaleString() || "N/A"} - ${analysis.salaryRange.max?.toLocaleString() || "N/A"}`);
    }
    logger.info(`Remote: ${analysis.remoteWorkTrends.remote} | Hybrid: ${analysis.remoteWorkTrends.hybrid} | Onsite: ${analysis.remoteWorkTrends.onsite}`);
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    logger.error(`Market analysis generation failed: ${errMsg}`);
    return;
  }

  logger.success("\nMarket analysis workflow completed!");
  logger.info(`Reports: ${PATHS.marketAnalysis}`);
  logger.info(`         ${path.join(PATHS.reports, "market-analysis.md")}`);
}

// Direct execution support
const isDirectRun = process.argv[1]?.endsWith("extract/index.ts") ||
                    process.argv[1]?.endsWith("extract/index.js");
if (isDirectRun) {
  runMarketAnalysis();
}
