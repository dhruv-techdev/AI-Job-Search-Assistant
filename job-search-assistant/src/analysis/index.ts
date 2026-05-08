import dotenv from "dotenv";
import { logger } from "../shared/logger.js";

dotenv.config();

interface GapOptions {
  verbose?: boolean;
}

export async function runGapAnalysis(resumePath: string, options: GapOptions = {}): Promise<void> {
  logger.info("=== Gap Analysis Workflow ===");
  logger.info(`Resume path: ${resumePath}`);

  // TODO: Implement in future stories
  // 1. Verify resume PDF exists
  // 2. Verify market analysis exists
  // 3. Extract resume text from PDF
  // 4. Send to LLM for structured extraction
  // 5. Compare resume against market data
  // 6. Generate gap analysis
  // 7. Save JSON + Markdown reports

  logger.warn("Gap analysis not yet implemented. Run 'npm run market' first.");
  logger.success("Gap analysis workflow completed (placeholder).");
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
