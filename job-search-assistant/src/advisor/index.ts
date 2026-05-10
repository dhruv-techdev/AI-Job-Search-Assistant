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

  // Step 4: Resume adaptations
  const resumeSpinner = ora("Generating resume suggestions...").start();
  let resumeAdaptations;
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

  // Step 5: Cover letter
  let coverLetterGuidance;
  if (options.coverLetter !== false) {
    const guidanceSpinner = ora("Generating cover letter guidance...").start();
    try {
      coverLetterGuidance = await generateCoverLetterGuidance(jobData, resume);
      guidanceSpinner.succeed("Cover letter guidance generated");

      console.log();
      logger.info("=== Cover Letter Strategy ===");
      logger.info("Key Points:");
      for (const p of coverLetterGuidance.keyPoints) logger.info(`  • ${p}`);
      logger.info("Strengths:");
      for (const s of coverLetterGuidance.strengthsToEmphasize) logger.info(`  ✓ ${s}`);
      if (coverLetterGuidance.gapsToAddress.length > 0) {
        logger.info("Gaps to Address:");
        for (const g of coverLetterGuidance.gapsToAddress) logger.info(`  → ${g}`);
      }
      logger.info("Company Angles:");
      for (const a of coverLetterGuidance.companyAngles) logger.info(`  🏢 ${a}`);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      guidanceSpinner.fail("Cover letter guidance failed");
      logger.error(errMsg);
      coverLetterGuidance = { keyPoints: [], strengthsToEmphasize: [], gapsToAddress: [], companyAngles: [] };
    }

    if (coverLetterGuidance.keyPoints.length > 0) {
      const draftSpinner = ora("Writing cover letter draft...").start();
      try {
        const coverLetterText = await generateCoverLetterDraft(jobData, resume, coverLetterGuidance, "professional");
        draftSpinner.succeed("Cover letter draft generated");
        saveCoverLetter(coverLetterText, jobData, outputName);
      } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : String(error);
        draftSpinner.fail("Cover letter draft failed");
        logger.error(errMsg);
      }
    }
  } else {
    logger.info("Skipping cover letter (--no-cover-letter).");
    coverLetterGuidance = { keyPoints: [], strengthsToEmphasize: [], gapsToAddress: [], companyAngles: [] };
  }

  // Step 6: Interview preparation
  const interviewSpinner = ora("Generating interview preparation...").start();
  let interviewPrep;
  try {
    interviewPrep = await generateInterviewPrep(jobData, resume);
    interviewSpinner.succeed(`Generated ${interviewPrep.likelyQuestions.length} interview questions`);

    console.log();
    logger.info("=== Interview Preparation ===");
    logger.info("Likely Questions:");
    for (let i = 0; i < interviewPrep.likelyQuestions.length; i++) {
      const q = interviewPrep.likelyQuestions[i];
      logger.info(`  ${i + 1}. ${q.question}`);
      logger.info(`     → ${q.suggestedApproach}`);
    }
    console.log();
    logger.info("Skills to Review:");
    for (const s of interviewPrep.skillsToReview) logger.info(`  📖 ${s}`);
    console.log();
    logger.info("Company Research Points:");
    for (const p of interviewPrep.companyResearchPoints) logger.info(`  🔍 ${p}`);
    console.log();
    logger.info("Talking Points:");
    for (const t of interviewPrep.talkingPoints) logger.info(`  💬 ${t}`);
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    interviewSpinner.fail("Interview prep failed");
    logger.error(errMsg);
    interviewPrep = { likelyQuestions: [], skillsToReview: [], companyResearchPoints: [], talkingPoints: [] };
  }

  // Save complete report
  const reportData = {
    jobTitle: jobData.jobTitle,
    companyName: jobData.companyName,
    fitAssessment,
    resumeAdaptations,
    coverLetterGuidance,
    interviewPreparation: interviewPrep,
    generatedAt: new Date().toISOString(),
  };

  const jsonPath = path.join(PATHS.reports, `application-${outputName}.json`);
  saveJSON(jsonPath, reportData);

  console.log();
  logger.success("=== Application Advisor Complete! ===");
  logger.info(`Report JSON: ${jsonPath}`);
  logger.info(`Cover Letter: reports/cover-letter-${outputName}.md`);
  logger.warn("Markdown and HTML report generation not yet implemented.");
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
