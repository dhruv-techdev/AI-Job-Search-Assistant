import fs from "fs";
import path from "path";
import { z } from "zod";
import { logger } from "../shared/logger.js";
import { PATHS, loadJSON } from "../shared/tools.js";
import { extractTextFromPDF } from "../shared/pdf.js";
import { callLLMWithRetry, extractJSON } from "../shared/llm.js";
import { buildJobExtractionPrompt } from "../extract/prompts.js";
import {
  JobPostingSchema,
  type JobPosting,
  type Resume,
  type GapAnalysis,
  type MarketAnalysis,
  type ApplicationReport,
} from "../shared/types.js";

const FitAssessmentSchema = z.object({
  overallScore: z.number().min(0).max(100),
  recommendation: z.enum(["strong_fit", "good_fit", "stretch", "growth_target"]),
  recommendationText: z.string(),
  skillMatches: z.array(
    z.object({
      skill: z.string(),
      status: z.enum(["match", "partial", "gap"]),
      note: z.string(),
    })
  ),
  experienceMatch: z.string(),
  educationMatch: z.string(),
});

export async function extractTargetJob(jobPath: string): Promise<JobPosting> {
  const fileName = path.basename(jobPath);
  const text = await extractTextFromPDF(jobPath);
  const prompt = buildJobExtractionPrompt(text, fileName);

  const rawResponse = await callLLMWithRetry(prompt, {
    model: "primary",
    temperature: 0.1,
    maxTokens: 8192,
    fallbackModels: ["secondary", "creative"],
  });

  const jsonStr = extractJSON(rawResponse);
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error(`LLM returned invalid JSON for job posting:\n${jsonStr.substring(0, 300)}`);
  }

  const result = JobPostingSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Job posting schema validation failed:\n${issues}`);
  }

  return result.data;
}

export function loadCandidateContext(): { resume: Resume; gap: GapAnalysis; market: MarketAnalysis } {
  if (!fs.existsSync(PATHS.resumeData)) {
    throw new Error("Resume data not found. Run 'npm run gaps <resume.pdf>' first.");
  }
  if (!fs.existsSync(PATHS.gapAnalysis)) {
    throw new Error("Gap analysis not found. Run 'npm run gaps <resume.pdf>' first.");
  }
  if (!fs.existsSync(PATHS.marketAnalysis)) {
    throw new Error("Market analysis not found. Run 'npm run market' first.");
  }

  const resume = loadJSON<Resume>(PATHS.resumeData);
  const gap = loadJSON<GapAnalysis>(PATHS.gapAnalysis);
  const market = loadJSON<MarketAnalysis>(PATHS.marketAnalysis);

  if (!resume || !gap || !market) {
    throw new Error("Failed to load one or more required data files.");
  }

  logger.debug("Loaded resume, gap analysis, and market analysis.");
  return { resume, gap, market };
}

function buildFitAssessmentPrompt(
  job: JobPosting,
  resume: Resume,
  gap: GapAnalysis,
  market: MarketAnalysis
): string {
  return `You are a professional career advisor. Analyze this candidate's fit for the target job and return a structured assessment.

TARGET JOB:
- Title: ${job.jobTitle}
- Company: ${job.companyName}
- Required Skills: ${job.requiredSkills.join(", ")}
- Preferred Skills: ${job.preferredSkills.join(", ")}
- Experience Required: ${job.experienceYears != null ? `${job.experienceYears} years` : "Not specified"}
- Seniority: ${job.seniorityLevel}
- Education: ${job.educationRequirements.join(", ") || "Not specified"}
- Responsibilities: ${job.responsibilities.slice(0, 5).join("; ")}

CANDIDATE PROFILE:
- Hard Skills: ${resume.hardSkills.join(", ")}
- Soft Skills: ${resume.softSkills.join(", ")}
- Work Experience: ${resume.workExperience.length} position(s): ${resume.workExperience.map((e) => `${e.title} at ${e.company}`).join("; ") || "None listed"}
- Education: ${resume.education.map((e) => `${e.degree} from ${e.institution}`).join("; ")}
- Projects: ${resume.projects.map((p) => `${p.name} (${p.skills.join(", ")})`).join("; ")}
- Certifications: ${resume.certifications.join(", ") || "None"}

GAP ANALYSIS CONTEXT:
- Overall Readiness: ${gap.overallReadinessScore}/100
- Strengths: ${gap.strengths.map((s) => s.skill).join(", ")}
- Key Gaps: ${gap.gaps.map((g) => g.skill).join(", ")}

MARKET CONTEXT:
- Top market skills: ${market.topRequiredSkills.slice(0, 5).map((s) => s.skill).join(", ")}

RULES:
- overallScore: 0-100 reflecting fit for THIS specific job (not general readiness)
- recommendation: "strong_fit" (85+), "good_fit" (65-84), "stretch" (45-64), "growth_target" (<45)
- skillMatches: evaluate EVERY required skill from the job — "match" (clearly has it), "partial" (related but not exact), "gap" (missing)
- experienceMatch: one sentence assessing experience alignment
- educationMatch: one sentence assessing education alignment
- recommendationText: 2-3 sentences explaining the recommendation with specific evidence

Return ONLY valid JSON (no markdown, no backticks):

{
  "overallScore": 0-100,
  "recommendation": "strong_fit | good_fit | stretch | growth_target",
  "recommendationText": "string",
  "skillMatches": [
    { "skill": "string", "status": "match | partial | gap", "note": "brief explanation" }
  ],
  "experienceMatch": "string",
  "educationMatch": "string"
}`;
}

export async function generateFitAssessment(
  job: JobPosting,
  resume: Resume,
  gap: GapAnalysis,
  market: MarketAnalysis
): Promise<ApplicationReport["fitAssessment"]> {
  const prompt = buildFitAssessmentPrompt(job, resume, gap, market);
  const rawResponse = await callLLMWithRetry(prompt, {
    model: "primary",
    temperature: 0.2,
    maxTokens: 8192,
    fallbackModels: ["secondary", "creative"],
  });

  const jsonStr = extractJSON(rawResponse);
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error(`LLM returned invalid JSON for fit assessment:\n${jsonStr.substring(0, 300)}`);
  }

  const result = FitAssessmentSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Fit assessment schema validation failed:\n${issues}`);
  }

  return result.data;
}

export function getRecommendationLabel(recommendation: string): string {
  const labels: Record<string, string> = {
    strong_fit: "Strong Fit — Apply with confidence",
    good_fit: "Good Fit — Worth applying",
    stretch: "Stretch Role — Apply and prepare for gaps",
    growth_target: "Growth Target — Build skills first",
  };
  return labels[recommendation] ?? recommendation;
}
