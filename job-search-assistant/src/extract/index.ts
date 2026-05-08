import dotenv from "dotenv";
import path from "path";
import { logger } from "../shared/logger.js";
import {
  scanForPDFs,
  validatePDFFile,
  isAlreadyProcessed,
  getJobJSONPath,
  saveJSON,
  ensureDirectories,
  PATHS,
} from "../shared/tools.js";
import { extractTextFromPDF } from "../shared/pdf.js";

dotenv.config();

interface MarketOptions {
  force?: boolean;
  verbose?: boolean;
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

  // Step 2: Filter out already processed (unless force)
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
    logger.info("All job postings already processed. Nothing to do.");
    logger.info("Use --force flag to reprocess all files.");
    // TODO: Continue to market analysis generation in future story
    return;
  }

  logger.info(`Processing ${toProcess.length} job posting(s)...\n`);

  // Step 3: Extract text from each PDF
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const pdfPath = toProcess[i];
    const fileName = path.basename(pdfPath);
    logger.info(`[${i + 1}/${toProcess.length}] Processing: ${fileName}`);

    // Validate
    const validation = validatePDFFile(pdfPath);
    if (!validation.valid) {
      logger.error(`  Validation failed: ${validation.error}`);
      failCount++;
      continue;
    }

    // Extract text
    try {
      const text = await extractTextFromPDF(pdfPath);
      logger.success(`  Extracted ${text.length} characters`);

      // TODO: Send to LLM for structured extraction (future story)
      // TODO: Validate with Zod schema (future story)
      // TODO: Research company via Tavily (future story)

      // For now, save raw extraction as placeholder
      const outputPath = getJobJSONPath(pdfPath);
      saveJSON(outputPath, {
        _status: "text_extracted",
        _sourceFile: fileName,
        _extractedAt: new Date().toISOString(),
        _textLength: text.length,
        _textPreview: text.substring(0, 500) + "...",
        rawText: text,
      });

      logger.success(`  Saved: ${outputPath}`);
      successCount++;
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      logger.error(`  Extraction failed: ${errMsg}`);
      failCount++;
    }

    console.log(); // blank line between files
  }

  // Summary
  logger.info("=== Extraction Summary ===");
  logger.info(`Total PDFs found:  ${pdfFiles.length}`);
  logger.info(`Skipped (cached):  ${skipped.length}`);
  logger.success(`Extracted:         ${successCount}`);
  if (failCount > 0) {
    logger.error(`Failed:            ${failCount}`);
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
