import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import ora from "ora";
import { logger } from "../shared/logger.js";
import { loadJSON, saveJSON, saveFile, ensureDirectories, PATHS } from "../shared/tools.js";
import { JobPostingSchema, ResumeSchema, MarketAnalysisSchema, GapAnalysisSchema, ApplicationReportSchema } from "../shared/types.js";
import { classifyFit } from "../shared/fit.js";

dotenv.config();

interface EvalOptions {
  verbose?: boolean;
}

interface EvalResult {
  category: string;
  check: string;
  status: "pass" | "fail" | "warn";
  detail: string;
}

/**
 * ST-2: Checks extraction quality for all job postings.
 */
function evaluateExtractions(): EvalResult[] {
  const results: EvalResult[] = [];
  const jobsDir = PATHS.jobs;

  if (!fs.existsSync(jobsDir)) {
    results.push({ category: "Extraction", check: "Jobs directory", status: "fail", detail: "data/jobs/ directory not found" });
    return results;
  }

  const files = fs.readdirSync(jobsDir).filter((f) => f.endsWith(".json"));

  if (files.length === 0) {
    results.push({ category: "Extraction", check: "Job files", status: "fail", detail: "No extracted job JSON files found. Run 'npm run market' first." });
    return results;
  }

  results.push({ category: "Extraction", check: "Job files found", status: "pass", detail: `${files.length} job file(s) found` });

  let validCount = 0;
  let invalidCount = 0;
  const issues: string[] = [];

  for (const file of files) {
    const filePath = path.join(jobsDir, file);
    const raw = loadJSON<unknown>(filePath);
    const result = JobPostingSchema.safeParse(raw);

    if (result.success) {
      validCount++;
      const job = result.data;

      // Spot checks
      if (!job.jobTitle || job.jobTitle.length < 3) {
        issues.push(`${file}: job title too short or missing`);
      }
      if (!job.companyName || job.companyName.length < 2) {
        issues.push(`${file}: company name missing`);
      }
      if (job.requiredSkills.length === 0) {
        issues.push(`${file}: no required skills extracted`);
      }
      if (job.responsibilities.length === 0) {
        issues.push(`${file}: no responsibilities extracted`);
      }
      if (job.salaryMin !== null && job.salaryMax !== null && job.salaryMin > job.salaryMax) {
        issues.push(`${file}: salary min (${job.salaryMin}) > max (${job.salaryMax})`);
      }
    } else {
      invalidCount++;
      issues.push(`${file}: schema validation failed — ${result.error.issues[0]?.message}`);
    }
  }

  results.push({ category: "Extraction", check: "Schema validation", status: invalidCount === 0 ? "pass" : "warn", detail: `${validCount} valid, ${invalidCount} invalid` });

  if (issues.length > 0) {
    for (const issue of issues) {
      results.push({ category: "Extraction", check: "Spot check", status: "warn", detail: issue });
    }
  } else {
    results.push({ category: "Extraction", check: "Spot checks", status: "pass", detail: "All extractions passed spot checks" });
  }

  // Resume extraction
  if (fs.existsSync(PATHS.resumeData)) {
    const resumeRaw = loadJSON<unknown>(PATHS.resumeData);
    const resumeResult = ResumeSchema.safeParse(resumeRaw);
    if (resumeResult.success) {
      const r = resumeResult.data;
      results.push({ category: "Extraction", check: "Resume schema", status: "pass", detail: `Resume valid: ${r.candidateName}` });
      if (r.hardSkills.length === 0) {
        results.push({ category: "Extraction", check: "Resume skills", status: "warn", detail: "No hard skills extracted from resume" });
      } else {
        results.push({ category: "Extraction", check: "Resume skills", status: "pass", detail: `${r.hardSkills.length} hard skills, ${r.softSkills.length} soft skills` });
      }
      if (r.workExperience.length === 0) {
        results.push({ category: "Extraction", check: "Resume experience", status: "warn", detail: "No work experience extracted" });
      } else {
        results.push({ category: "Extraction", check: "Resume experience", status: "pass", detail: `${r.workExperience.length} position(s)` });
      }
    } else {
      results.push({ category: "Extraction", check: "Resume schema", status: "fail", detail: "Resume data failed schema validation" });
    }
  } else {
    results.push({ category: "Extraction", check: "Resume file", status: "warn", detail: "No resume data found. Run 'npm run gaps <resume.pdf>'" });
  }

  return results;
}

/**
 * ST-3: Checks report quality and completeness.
 */
function evaluateReports(): EvalResult[] {
  const results: EvalResult[] = [];

  // Market analysis
  if (fs.existsSync(PATHS.marketAnalysis)) {
    const raw = loadJSON<unknown>(PATHS.marketAnalysis);
    const result = MarketAnalysisSchema.safeParse(raw);
    if (result.success) {
      const m = result.data;
      results.push({ category: "Reports", check: "Market analysis JSON", status: "pass", detail: `${m.totalPostingsAnalyzed} postings analyzed` });
      if (m.topRequiredSkills.length < 3) {
        results.push({ category: "Reports", check: "Market skills", status: "warn", detail: "Fewer than 3 required skills identified" });
      }
    } else {
      results.push({ category: "Reports", check: "Market analysis JSON", status: "fail", detail: "Schema validation failed" });
    }
  } else {
    results.push({ category: "Reports", check: "Market analysis", status: "warn", detail: "Not generated yet. Run 'npm run market'" });
  }

  // Market report markdown
  const marketMd = path.join(PATHS.reports, "market-analysis.md");
  if (fs.existsSync(marketMd)) {
    const content = fs.readFileSync(marketMd, "utf-8");
    results.push({ category: "Reports", check: "Market report MD", status: "pass", detail: `${content.length} chars` });
  } else {
    results.push({ category: "Reports", check: "Market report MD", status: "warn", detail: "Not found" });
  }

  // Gap analysis
  if (fs.existsSync(PATHS.gapAnalysis)) {
    const raw = loadJSON<unknown>(PATHS.gapAnalysis);
    const result = GapAnalysisSchema.safeParse(raw);
    if (result.success) {
      const g = result.data;
      results.push({ category: "Reports", check: "Gap analysis JSON", status: "pass", detail: `Readiness: ${g.overallReadinessScore}/100, ${g.gaps.length} gaps, ${g.strengths.length} strengths` });
      if (g.overallReadinessScore < 0 || g.overallReadinessScore > 100) {
        results.push({ category: "Reports", check: "Gap score range", status: "fail", detail: `Score out of range: ${g.overallReadinessScore}` });
      }
    } else {
      results.push({ category: "Reports", check: "Gap analysis JSON", status: "fail", detail: "Schema validation failed" });
    }
  } else {
    results.push({ category: "Reports", check: "Gap analysis", status: "warn", detail: "Not generated yet" });
  }

  // Gap report markdown
  const gapMd = path.join(PATHS.reports, "gap-analysis.md");
  if (fs.existsSync(gapMd)) {
    results.push({ category: "Reports", check: "Gap report MD", status: "pass", detail: "Found" });
  } else {
    results.push({ category: "Reports", check: "Gap report MD", status: "warn", detail: "Not found" });
  }

  // Application reports
  const reportFiles = fs.existsSync(PATHS.reports)
    ? fs.readdirSync(PATHS.reports).filter((f) => f.startsWith("application-") && f.endsWith(".json"))
    : [];

  if (reportFiles.length > 0) {
    for (const file of reportFiles) {
      const raw = loadJSON<unknown>(path.join(PATHS.reports, file));
      const result = ApplicationReportSchema.safeParse(raw);
      if (result.success) {
        const r = result.data;
        results.push({ category: "Reports", check: `App report: ${file}`, status: "pass", detail: `Score: ${r.fitAssessment.overallScore}/100, ${r.resumeAdaptations.length} suggestions` });

        // Check fit score classification
        const score = r.fitAssessment.overallScore;
        const rec = r.fitAssessment.recommendation;
        const expectedRec = classifyFit(score);

        if (rec !== expectedRec) {
          results.push({ category: "Reports", check: "Fit classification", status: "warn", detail: `Score ${score} classified as ${rec}, expected ${expectedRec}` });
        } else {
          results.push({ category: "Reports", check: "Fit classification", status: "pass", detail: `Score ${score} correctly classified as ${rec}` });
        }
      } else {
        results.push({ category: "Reports", check: `App report: ${file}`, status: "fail", detail: "Schema validation failed" });
      }
    }

    // Check for matching MD and HTML
    for (const file of reportFiles) {
      const baseName = file.replace(".json", "");
      const mdExists = fs.existsSync(path.join(PATHS.reports, `${baseName}.md`));
      const htmlExists = fs.existsSync(path.join(PATHS.reports, `${baseName}.html`));
      results.push({ category: "Reports", check: `${baseName} MD`, status: mdExists ? "pass" : "warn", detail: mdExists ? "Found" : "Missing" });
      results.push({ category: "Reports", check: `${baseName} HTML`, status: htmlExists ? "pass" : "warn", detail: htmlExists ? "Found" : "Missing" });
    }
  } else {
    results.push({ category: "Reports", check: "Application reports", status: "warn", detail: "No application reports found. Run 'npm run advise <job.pdf>'" });
  }

  // Cover letters
  const coverLetters = fs.existsSync(PATHS.reports)
    ? fs.readdirSync(PATHS.reports).filter((f) => f.startsWith("cover-letter-") && f.endsWith(".md"))
    : [];
  results.push({ category: "Reports", check: "Cover letters", status: coverLetters.length > 0 ? "pass" : "warn", detail: `${coverLetters.length} cover letter(s) found` });

  return results;
}

/**
 * Generates evaluation summary.
 */
function generateEvalReport(results: EvalResult[]): { json: object; markdown: string } {
  const passCount = results.filter((r) => r.status === "pass").length;
  const warnCount = results.filter((r) => r.status === "warn").length;
  const failCount = results.filter((r) => r.status === "fail").length;
  const total = results.length;

  const json = {
    summary: {
      total,
      pass: passCount,
      warn: warnCount,
      fail: failCount,
      score: `${Math.round((passCount / total) * 100)}%`,
      evaluatedAt: new Date().toISOString(),
    },
    results,
  };

  let md = `# Evaluation Report\n\n`;
  md += `**Evaluated:** ${new Date().toLocaleString()}\n`;
  md += `**Overall Score:** ${Math.round((passCount / total) * 100)}%\n\n`;
  md += `| Status | Count |\n|--------|-------|\n`;
  md += `| ✅ Pass | ${passCount} |\n`;
  md += `| ⚠️ Warn | ${warnCount} |\n`;
  md += `| ❌ Fail | ${failCount} |\n`;
  md += `| **Total** | **${total}** |\n\n`;
  md += `---\n\n`;

  // Group by category
  const categories = [...new Set(results.map((r) => r.category))];
  for (const cat of categories) {
    md += `## ${cat}\n\n`;
    md += `| Check | Status | Detail |\n|-------|--------|--------|\n`;
    for (const r of results.filter((r) => r.category === cat)) {
      const icon = r.status === "pass" ? "✅" : r.status === "warn" ? "⚠️" : "❌";
      md += `| ${r.check} | ${icon} | ${r.detail} |\n`;
    }
    md += `\n`;
  }

  md += `---\n\n*Report generated by AI Job Search Assistant Evaluation Harness*\n`;

  return { json, markdown: md };
}

/**
 * ST-1: Main evaluation workflow.
 */
export async function runEvaluation(options: EvalOptions = {}): Promise<void> {
  logger.info("=== Evaluation Workflow ===\n");
  ensureDirectories();

  const allResults: EvalResult[] = [];

  // ST-2: Extraction quality checks
  const extractSpinner = ora("Checking extraction quality...").start();
  const extractionResults = evaluateExtractions();
  allResults.push(...extractionResults);
  const extractFails = extractionResults.filter((r) => r.status === "fail").length;
  if (extractFails > 0) {
    extractSpinner.fail(`Extraction checks: ${extractFails} failure(s)`);
  } else {
    extractSpinner.succeed("Extraction checks complete");
  }

  // ST-3: Report quality checks
  const reportSpinner = ora("Checking report quality...").start();
  const reportResults = evaluateReports();
  allResults.push(...reportResults);
  const reportFails = reportResults.filter((r) => r.status === "fail").length;
  if (reportFails > 0) {
    reportSpinner.fail(`Report checks: ${reportFails} failure(s)`);
  } else {
    reportSpinner.succeed("Report checks complete");
  }

  // ST-4: Save evaluation results
  const { json, markdown } = generateEvalReport(allResults);

  saveJSON("eval/evaluation-data.json", json);
  saveFile("eval/evaluation-results.md", markdown);

  // ST-5: Print summary
  const passCount = allResults.filter((r) => r.status === "pass").length;
  const warnCount = allResults.filter((r) => r.status === "warn").length;
  const failCount = allResults.filter((r) => r.status === "fail").length;
  const total = allResults.length;
  const score = Math.round((passCount / total) * 100);

  console.log();
  logger.info("=== Evaluation Summary ===");
  logger.success(`✅ Pass:  ${passCount}`);
  if (warnCount > 0) logger.warn(`⚠️  Warn:  ${warnCount}`);
  if (failCount > 0) logger.error(`❌ Fail:  ${failCount}`);
  logger.info(`📊 Score: ${score}%`);

  console.log();

  // Print all results
  for (const r of allResults) {
    const icon = r.status === "pass" ? "✅" : r.status === "warn" ? "⚠️ " : "❌";
    const logFn = r.status === "fail" ? logger.error : r.status === "warn" ? logger.warn : logger.info;
    logFn(`  ${icon} [${r.category}] ${r.check}: ${r.detail}`);
  }

  console.log();
  logger.info("Evaluation saved:");
  logger.info("  JSON:     eval/evaluation-data.json");
  logger.info("  Markdown: eval/evaluation-results.md");

  // Final project status
  console.log();
  if (failCount === 0 && warnCount <= 3) {
    logger.success("🎉 Project is ready for professional demo!");
  } else if (failCount === 0) {
    logger.info("👍 Project is functional. Review warnings for improvement.");
  } else {
    logger.warn("⚠️  Address failures before demo. Run the missing workflows first.");
  }
}

// Direct execution support
const isDirectRun = process.argv[1]?.endsWith("eval/index.ts") ||
                    process.argv[1]?.endsWith("eval/index.js");
if (isDirectRun) {
  runEvaluation();
}
