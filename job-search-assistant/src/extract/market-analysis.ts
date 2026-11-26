import fs from "fs";
import path from "path";
import { logger } from "../shared/logger.js";
import { PATHS, loadJSON, saveJSON } from "../shared/tools.js";
import { JobPostingSchema, MarketAnalysisSchema, type JobPosting, type MarketAnalysis } from "../shared/types.js";

/**
 * ST-1: Loads all valid job posting JSON files from data/jobs.
 */
export function loadExtractedJobs(): JobPosting[] {
  const jobsDir = PATHS.jobs;

  if (!fs.existsSync(jobsDir)) {
    logger.error(`Jobs directory not found: ${jobsDir}`);
    return [];
  }

  const files = fs.readdirSync(jobsDir).filter((f) => f.endsWith(".json"));

  if (files.length === 0) {
    logger.warn("No extracted job files found in data/jobs/");
    return [];
  }

  const jobs: JobPosting[] = [];

  for (const file of files) {
    const filePath = path.join(jobsDir, file);
    try {
      const raw = loadJSON<unknown>(filePath);
      const result = JobPostingSchema.safeParse(raw);
      if (result.success) {
        jobs.push(result.data);
      } else {
        logger.warn(`Skipping invalid job file: ${file}`);
        logger.debug(`  Validation errors: ${result.error.issues.map((i) => i.message).join(", ")}`);
      }
    } catch {
      logger.warn(`Skipping unreadable file: ${file}`);
    }
  }

  logger.info(`Loaded ${jobs.length} valid job posting(s) from ${files.length} file(s)`);
  return jobs;
}

/**
 * ST-2: Calculates skill frequency across all postings.
 */
function calculateSkillFrequency(
  jobs: JobPosting[],
  field: "requiredSkills" | "preferredSkills"
): { skill: string; count: number; percentage: number }[] {
  const freq = new Map<string, number>();
  const total = jobs.length;

  for (const job of jobs) {
    const skills = job[field];
    // Deduplicate per job (same skill listed twice in one posting)
    const unique = new Set(skills.map((s) => s.toLowerCase().trim()));
    for (const skill of unique) {
      freq.set(skill, (freq.get(skill) || 0) + 1);
    }
  }

  return Array.from(freq.entries())
    .map(([skill, count]) => ({
      skill: skill.charAt(0).toUpperCase() + skill.slice(1), // Title case
      count,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * ST-3: Analyzes experience, salary, seniority, remote, education, and responsibility trends.
 */
function analyzeJobTrends(jobs: JobPosting[]) {
  // Experience levels
  const experienceLevels = { entry: 0, mid: 0, senior: 0 };
  for (const job of jobs) {
    const level = job.seniorityLevel;
    if (level === "intern" || level === "entry") experienceLevels.entry++;
    else if (level === "mid") experienceLevels.mid++;
    else if (level === "senior" || level === "lead" || level === "manager") experienceLevels.senior++;
    else {
      // Infer from experience years if seniority not listed
      if (job.experienceYears !== null) {
        if (job.experienceYears <= 2) experienceLevels.entry++;
        else if (job.experienceYears <= 5) experienceLevels.mid++;
        else experienceLevels.senior++;
      }
    }
  }

  // Salary range
  const salaries = jobs.filter((j) => j.salaryMin !== null || j.salaryMax !== null);
  let salaryRange: MarketAnalysis["salaryRange"] = null;
  if (salaries.length > 0) {
    const mins = salaries.map((j) => j.salaryMin).filter((v): v is number => v !== null);
    const maxs = salaries.map((j) => j.salaryMax).filter((v): v is number => v !== null);
    const currencies = salaries.map((j) => j.salaryCurrency).filter((v): v is string => v !== null);
    salaryRange = {
      min: mins.length > 0 ? Math.min(...mins) : null,
      max: maxs.length > 0 ? Math.max(...maxs) : null,
      currency: currencies[0] || null,
    };
  }

  // Remote work trends
  const remoteWorkTrends = { remote: 0, hybrid: 0, onsite: 0, notListed: 0 };
  for (const job of jobs) {
    if (job.remoteStatus === "remote") remoteWorkTrends.remote++;
    else if (job.remoteStatus === "hybrid") remoteWorkTrends.hybrid++;
    else if (job.remoteStatus === "onsite") remoteWorkTrends.onsite++;
    else remoteWorkTrends.notListed++;
  }

  // Common responsibilities (aggregate and count)
  const respFreq = new Map<string, number>();
  for (const job of jobs) {
    for (const resp of job.responsibilities) {
      const key = resp.toLowerCase().trim();
      if (key.length > 10) {
        respFreq.set(key, (respFreq.get(key) || 0) + 1);
      }
    }
  }
  const commonResponsibilities = Array.from(respFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([r]) => r.charAt(0).toUpperCase() + r.slice(1));

  // Education trends
  const eduFreq = new Map<string, number>();
  for (const job of jobs) {
    for (const edu of job.educationRequirements) {
      const key = edu.toLowerCase().trim();
      eduFreq.set(key, (eduFreq.get(key) || 0) + 1);
    }
  }
  const educationTrends = Array.from(eduFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([e]) => e.charAt(0).toUpperCase() + e.slice(1));

  // Industry insights from company research
  const insights: string[] = [];
  const companySizes = jobs
    .map((j) => j.companyResearch?.companySize)
    .filter((v): v is string => v != null);
  if (companySizes.length > 0) {
    insights.push(`Company sizes range from: ${[...new Set(companySizes)].join(", ")}`);
  }

  const allCulture = jobs.flatMap((j) => j.companyResearch?.cultureSignals || []);
  const cultureFreq = new Map<string, number>();
  for (const signal of allCulture) {
    cultureFreq.set(signal, (cultureFreq.get(signal) || 0) + 1);
  }
  const topCulture = Array.from(cultureFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topCulture.length > 0) {
    insights.push(`Top culture signals: ${topCulture.map(([s]) => s).join(", ")}`);
  }

  const remotePercent = Math.round(((remoteWorkTrends.remote + remoteWorkTrends.hybrid) / jobs.length) * 100);
  insights.push(`${remotePercent}% of postings offer remote or hybrid work`);

  if (salaryRange) {
    insights.push(
      `Salary range across postings: ${salaryRange.currency || ""} ${salaryRange.min?.toLocaleString() || "N/A"} - ${salaryRange.max?.toLocaleString() || "N/A"}`
    );
  }

  return {
    experienceLevels,
    salaryRange,
    remoteWorkTrends,
    commonResponsibilities,
    educationTrends,
    industryInsights: insights,
  };
}

/**
 * Generates the complete market analysis from extracted job postings.
 */
export function generateMarketAnalysis(jobs: JobPosting[]): MarketAnalysis {
  const topRequired = calculateSkillFrequency(jobs, "requiredSkills").slice(0, 15);
  const topPreferred = calculateSkillFrequency(jobs, "preferredSkills").slice(0, 10);
  const trends = analyzeJobTrends(jobs);

  const analysis: MarketAnalysis = {
    totalPostingsAnalyzed: jobs.length,
    topRequiredSkills: topRequired,
    topPreferredSkills: topPreferred,
    experienceLevels: trends.experienceLevels,
    salaryRange: trends.salaryRange,
    commonResponsibilities: trends.commonResponsibilities,
    educationTrends: trends.educationTrends,
    remoteWorkTrends: trends.remoteWorkTrends,
    industryInsights: trends.industryInsights,
    generatedAt: new Date().toISOString(),
  };

  // Validate before returning
  const result = MarketAnalysisSchema.safeParse(analysis);
  if (!result.success) {
    logger.error("Market analysis failed schema validation:");
    for (const issue of result.error.issues) {
      logger.error(`  - ${issue.path.join(".")}: ${issue.message}`);
    }
    throw new Error("Generated market analysis is invalid");
  }

  return result.data;
}

/**
 * ST-4: Saves market analysis as JSON.
 */
export function saveMarketAnalysis(analysis: MarketAnalysis): void {
  saveJSON(PATHS.marketAnalysis, analysis);
  logger.success(`Market analysis saved: ${PATHS.marketAnalysis}`);
}
