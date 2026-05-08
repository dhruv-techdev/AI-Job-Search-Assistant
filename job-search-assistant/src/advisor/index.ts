import dotenv from "dotenv";
import { logger } from "../shared/logger.js";

dotenv.config();

interface AdvisorOptions {
  output?: string;
  coverLetter?: boolean;
  html?: boolean;
  chat?: boolean;
  verbose?: boolean;
}

export async function runAdvisor(jobPath: string, options: AdvisorOptions = {}): Promise<void> {
  logger.info("=== Application Advisor Workflow ===");
  logger.info(`Target job posting: ${jobPath}`);
  logger.info(`Cover letter: ${options.coverLetter !== false}`);
  logger.info(`HTML report: ${options.html !== false}`);
  logger.info(`Chat mode: ${options.chat || false}`);
  if (options.output) logger.info(`Custom output name: ${options.output}`);

  // TODO: Implement in future stories
  // 1. Extract target job posting
  // 2. Load resume, gap analysis, market analysis
  // 3. Generate fit assessment
  // 4. Generate resume adaptation suggestions
  // 5. Generate cover letter guidance + optional full letter
  // 6. Generate interview preparation
  // 7. Compile application report
  // 8. Save JSON + Markdown + optional HTML
  // 9. Optionally enter conversation mode

  logger.warn("Application advisor not yet implemented. Run 'npm run market' and 'npm run gaps' first.");
  logger.success("Application advisor workflow completed (placeholder).");
}

// Direct execution support
const isDirectRun = process.argv[1]?.endsWith("advisor/index.ts") ||
                    process.argv[1]?.endsWith("advisor/index.js");
if (isDirectRun) {
  const jobPath = process.argv[2];
  if (!jobPath) {
    logger.error("Usage: npm run advise <path-to-job-posting.pdf>");
    process.exit(1);
  }
  runAdvisor(jobPath);
}
