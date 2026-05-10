import dotenv from "dotenv";
import fs from "fs";
import ora from "ora";
import path from "path";
import { logger } from "../shared/logger.js";
import { ensureDirectories, saveJSON, PATHS } from "../shared/tools.js";
import type { ApplicationReport } from "../shared/types.js";
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

  // Step 1: Validate job path
  if (!jobPath) {
    logger.error("Usage: npm run advise <path-to-job-posting.pdf>");
    process.exit(1);
  }

  if (!fs.existsSync(jobPath)) {
    logger.error(`Job posting not found: ${jobPath}`);
    process.exit(1);
  }

  const outputName = options.output || path.basename(jobPath, ".pdf").replace(/[^a-zA-Z0-9-_]/g, "-").substring(0, 60);

  // Step 2: Extract target job
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

  // Step 3: Load candidate context
  let context;
  try {
    context = loadCandidateContext();
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    logger.error(errMsg);
    process.exit(1);
  }

  const { resume, gap, market } = context;

  // Step 4: Generate fit assessment
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
  logger.info(`Score: ${fitAssessment.overallScore}/100`);
  logger.info(`Recommendation: ${getRecommendationLabel(fitAssessment.recommendation)}`);
  logger.info(`${fitAssessment.recommendationText}`);

  const matches = fitAssessment.skillMatches.filter((s) => s.status === "match");
  const partials = fitAssessment.skillMatches.filter((s) => s.status === "partial");
  const skillGaps = fitAssessment.skillMatches.filter((s) => s.status === "gap");

  if (matches.length > 0) logger.info(`  ✅ Match (${matches.length}): ${matches.map((s) => s.skill).join(", ")}`);
  if (partials.length > 0) logger.info(`  🔶 Partial (${partials.length}): ${partials.map((s) => s.skill).join(", ")}`);
  if (skillGaps.length > 0) logger.info(`  ❌ Gap (${skillGaps.length}): ${skillGaps.map((s) => s.skill).join(", ")}`);

  logger.info(`Experience: ${fitAssessment.experienceMatch}`);
  logger.info(`Education: ${fitAssessment.educationMatch}`);

  // Step 5: Generate resume adaptations
  const resumeSpinner = ora("Generating resume suggestions...").start();
  let resumeAdaptations: ApplicationReport["resumeAdaptations"];
  try {
    resumeAdaptations = await generateResumeAdaptations(jobData, resume);
    resumeSpinner.succeed(`Generated ${resumeAdaptations.length} resume suggestions`);
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    resumeSpinner.fail("Resume adaptations failed");
    logger.error(errMsg);
    resumeAdaptations = [];
  }

  if (resumeAdaptations.length > 0) {
    console.log();
    logger.info("=== Resume Suggestions ===");
    for (let i = 0; i < resumeAdaptations.length; i++) {
      const s = resumeAdaptations[i];
      logger.info(`${i + 1}. [${s.section}]`);
      logger.info(`   Current: ${s.currentContent}`);
      logger.info(`   Change:  ${s.suggestedChange}`);
      logger.info(`   Why:     ${s.rationale}`);
    }
  }

  // Step 6: Generate cover letter guidance + draft
  let coverLetterGuidance;
  let coverLetterText = "";

  if (options.coverLetter !== false) {
    const guidanceSpinner = ora("Generating cover letter guidance...").start();
    try {
      coverLetterGuidance = await generateCoverLetterGuidance(jobData, resume);
      guidanceSpinner.succeed("Cover letter guidance generated");

      console.log();
      logger.info("=== Cover Letter Strategy ===");
      logger.info("Key Points:");
      for (const point of coverLetterGuidance.keyPoints) {
        logger.info(`  • ${point}`);
      }
      logger.info("Strengths to Emphasize:");
      for (const s of coverLetterGuidance.strengthsToEmphasize) {
        logger.info(`  ✓ ${s}`);
      }
      if (coverLetterGuidance.gapsToAddress.length > 0) {
        logger.info("Gaps to Address:");
        for (const g of coverLetterGuidance.gapsToAddress) {
          logger.info(`  → ${g}`);
        }
      }
      logger.info("Company Angles:");
      for (const a of coverLetterGuidance.companyAngles) {
        logger.info(`  🏢 ${a}`);
      }
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      guidanceSpinner.fail("Cover letter guidance failed");
      logger.error(errMsg);
      coverLetterGuidance = {
        keyPoints: [],
        strengthsToEmphasize: [],
        gapsToAddress: [],
        companyAngles: [],
      };
    }

    // Generate full draft
    if (coverLetterGuidance.keyPoints.length > 0) {
      const draftSpinner = ora("Writing cover letter draft...").start();
      try {
        coverLetterText = await generateCoverLetterDraft(jobData, resume, coverLetterGuidance, "professional");
        draftSpinner.succeed("Cover letter draft generated");
        saveCoverLetter(coverLetterText, jobData, outputName);
      } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : String(error);
        draftSpinner.fail("Cover letter draft failed");
        logger.error(errMsg);
      }
    }
  } else {
    logger.info("Skipping cover letter generation (--no-cover-letter).");
    coverLetterGuidance = {
      keyPoints: [],
      strengthsToEmphasize: [],
      gapsToAddress: [],
      companyAngles: [],
    };
  }

  // Save report
  const reportData = {
    jobTitle: jobData.jobTitle,
    companyName: jobData.companyName,
    fitAssessment,
    resumeAdaptations,
    coverLetterGuidance,
    interviewPreparation: {      // TODO: US-13
      likelyQuestions: [],
      skillsToReview: [],
      companyResearchPoints: [],
      talkingPoints: [],
    },
    generatedAt: new Date().toISOString(),
  };

  const jsonPath = path.join(PATHS.reports, `application-${outputName}.json`);
  saveJSON(jsonPath, reportData);

  console.log();
  logger.success("Application advice generated!");
  logger.info(`Report: ${jsonPath}`);
  logger.warn("Interview preparation not yet implemented.");
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
