import dotenv from "dotenv";
import fs from "fs";
import ora from "ora";
import path from "path";
import { logger } from "../shared/logger.js";
import { ensureDirectories, saveJSON, PATHS } from "../shared/tools.js";
import {
  extractTargetJob,
  loadCandidateContext,
  generateFitAssessment,
  getRecommendationLabel,
} from "./fit-assessment.js";
import { generateResumeAdaptations } from "./resume-adaptations.js";
import {
  generateCoverLetterGuidance,
  generateCoverLetterDraft,
  saveCoverLetter,
} from "./cover-letter.js";
import { generateInterviewPrep } from "./interview-prep.js";
import { generateApplicationMarkdownReport } from "./markdown-report.js";
import { generateApplicationHTMLReport } from "./html-report.js";

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
  ensureDirectories();

  if (!jobPath) {
    logger.error("Usage: npm run advise <path-to-job-posting.pdf>");
    process.exit(1);
  }

  if (!fs.existsSync(jobPath)) {
    logger.error(`Job posting not found: ${jobPath}`);
    process.exit(1);
  }

  const outputName = options.output || path.basename(jobPath, ".pdf").replace(/[^a-zA-Z0-9-_]/g, "-").substring(0, 60);

  // Step 1: Extract target job
  const jobSpinner = ora("Extracting target job posting...").start();
  let jobData;
  try {
    jobData = await extractTargetJob(jobPath);
    jobSpinner.succeed(`Target: ${jobData.jobTitle} at ${jobData.companyName}`);
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    jobSpinner.fail("Job extraction failed");
    logger.error(errMsg);
    process.exit(1);
  }

  // Step 2: Load candidate context
  let context;
  try {
    context = loadCandidateContext();
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    logger.error(errMsg);
    process.exit(1);
  }
  const { resume, gap, market } = context;

  // Step 3: Fit assessment
  const fitSpinner = ora("Analyzing candidate fit...").start();
  let fitAssessment;
  try {
    fitAssessment = await generateFitAssessment(jobData, resume, gap, market);
    fitSpinner.succeed(`Fit Score: ${fitAssessment.overallScore}/100 — ${getRecommendationLabel(fitAssessment.recommendation)}`);
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    fitSpinner.fail("Fit assessment failed");
    logger.error(errMsg);
    process.exit(1);
  }

  // Print fit summary
  console.log();
  logger.info("=== Fit Assessment ===");
  logger.info(`Score: ${fitAssessment.overallScore}/100 — ${getRecommendationLabel(fitAssessment.recommendation)}`);
  logger.info(fitAssessment.recommendationText);
  const matches = fitAssessment.skillMatches.filter((s) => s.status === "match");
  const partials = fitAssessment.skillMatches.filter((s) => s.status === "partial");
  const skillGaps = fitAssessment.skillMatches.filter((s) => s.status === "gap");
  if (matches.length > 0) logger.info(`  ✅ Match (${matches.length}): ${matches.map((s) => s.skill).join(", ")}`);
  if (partials.length > 0) logger.info(`  🔶 Partial (${partials.length}): ${partials.map((s) => s.skill).join(", ")}`);
  if (skillGaps.length > 0) logger.info(`  ❌ Gap (${skillGaps.length}): ${skillGaps.map((s) => s.skill).join(", ")}`);

  // Step 4: Resume adaptations
  const resumeSpinner = ora("Generating resume suggestions...").start();
  let resumeAdaptations;
  try {
    resumeAdaptations = await generateResumeAdaptations(jobData, resume);
    resumeSpinner.succeed(`Generated ${resumeAdaptations.length} resume suggestions`);
  } catch (error: unknown) {
    resumeSpinner.fail("Resume adaptations failed");
    logger.error(error instanceof Error ? error.message : String(error));
    resumeAdaptations = [];
  }

  // Step 5: Cover letter
  let coverLetterGuidance;
  if (options.coverLetter !== false) {
    const guidanceSpinner = ora("Generating cover letter...").start();
    try {
      coverLetterGuidance = await generateCoverLetterGuidance(jobData, resume);
      guidanceSpinner.succeed("Cover letter guidance generated");

      if (coverLetterGuidance.keyPoints.length > 0) {
        const draftSpinner = ora("Writing cover letter draft...").start();
        try {
          const coverLetterText = await generateCoverLetterDraft(jobData, resume, coverLetterGuidance, "professional");
          draftSpinner.succeed("Cover letter draft generated");
          saveCoverLetter(coverLetterText, jobData, outputName);
        } catch (error: unknown) {
          draftSpinner.fail("Cover letter draft failed");
          logger.error(error instanceof Error ? error.message : String(error));
        }
      }
    } catch (error: unknown) {
      guidanceSpinner.fail("Cover letter guidance failed");
      logger.error(error instanceof Error ? error.message : String(error));
      coverLetterGuidance = { keyPoints: [], strengthsToEmphasize: [], gapsToAddress: [], companyAngles: [] };
    }
  } else {
    logger.info("Skipping cover letter (--no-cover-letter).");
    coverLetterGuidance = { keyPoints: [], strengthsToEmphasize: [], gapsToAddress: [], companyAngles: [] };
  }

  // Step 6: Interview prep
  const interviewSpinner = ora("Generating interview preparation...").start();
  let interviewPrep;
  try {
    interviewPrep = await generateInterviewPrep(jobData, resume);
    interviewSpinner.succeed(`Generated ${interviewPrep.likelyQuestions.length} interview questions`);
  } catch (error: unknown) {
    interviewSpinner.fail("Interview prep failed");
    logger.error(error instanceof Error ? error.message : String(error));
    interviewPrep = { likelyQuestions: [], skillsToReview: [], companyResearchPoints: [], talkingPoints: [] };
  }

  // Step 7: Build complete report object
  const reportData = {
    jobTitle: jobData.jobTitle,
    companyName: jobData.companyName,
    fitAssessment,
    resumeAdaptations,
    coverLetterGuidance,
    interviewPreparation: interviewPrep,
    generatedAt: new Date().toISOString(),
  };

  // Step 8: Save all reports
  const jsonPath = path.join(PATHS.reports, `application-${outputName}.json`);
  saveJSON(jsonPath, reportData);

  // Markdown report
  generateApplicationMarkdownReport(reportData, outputName);

  // HTML report
  if (options.html !== false) {
    generateApplicationHTMLReport(reportData, outputName);
  } else {
    logger.info("Skipping HTML report (--no-html).");
  }

  // Final summary
  console.log();
  logger.success("=== Application Advisor Complete! ===");
  logger.info(`JSON:         ${jsonPath}`);
  logger.info(`Markdown:     reports/application-${outputName}.md`);
  if (options.html !== false) {
    logger.info(`HTML:         reports/application-${outputName}.html`);
  }
  if (options.coverLetter !== false) {
    logger.info(`Cover Letter: reports/cover-letter-${outputName}.md`);
  }
  logger.info(`\nOpen HTML report: open reports/application-${outputName}.html`);
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
