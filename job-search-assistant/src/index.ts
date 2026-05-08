#!/usr/bin/env node
import { Command } from "commander";
import dotenv from "dotenv";
import { logger } from "./shared/logger.js";

dotenv.config();

const program = new Command();

program
  .name("job-search-assistant")
  .description("AI-powered Job Search and Application Intelligence Assistant")
  .version("1.0.0");

program
  .command("market")
  .description("Extract job postings and generate market analysis")
  .option("-f, --force", "Force reprocess all job postings", false)
  .option("-v, --verbose", "Enable verbose logging", false)
  .action(async (options) => {
    if (options.verbose) process.env.LOG_LEVEL = "debug";
    logger.info("Starting market analysis workflow...");
    const { runMarketAnalysis } = await import("./extract/index.js");
    await runMarketAnalysis(options);
  });

program
  .command("gaps")
  .description("Analyze resume against market data and generate gap analysis")
  .argument("<resumePath>", "Path to resume PDF file")
  .option("-v, --verbose", "Enable verbose logging", false)
  .action(async (resumePath: string, options) => {
    if (options.verbose) process.env.LOG_LEVEL = "debug";
    logger.info("Starting gap analysis workflow...");
    const { runGapAnalysis } = await import("./analysis/index.js");
    await runGapAnalysis(resumePath, options);
  });

program
  .command("advise")
  .description("Generate application advice for a target job posting")
  .argument("<jobPath>", "Path to target job posting PDF")
  .option("-o, --output <name>", "Custom output file name")
  .option("--no-cover-letter", "Skip cover letter generation")
  .option("--no-html", "Skip HTML report generation")
  .option("-c, --chat", "Enter conversation mode after report", false)
  .option("-v, --verbose", "Enable verbose logging", false)
  .action(async (jobPath: string, options) => {
    if (options.verbose) process.env.LOG_LEVEL = "debug";
    logger.info("Starting application advisor workflow...");
    const { runAdvisor } = await import("./advisor/index.js");
    await runAdvisor(jobPath, options);
  });

program
  .command("eval")
  .description("Run evaluation harness to review output quality")
  .option("-v, --verbose", "Enable verbose logging", false)
  .action(async (options) => {
    if (options.verbose) process.env.LOG_LEVEL = "debug";
    logger.info("Starting evaluation workflow...");
    const { runEvaluation } = await import("./eval/index.js");
    await runEvaluation(options);
  });

program.parse();
