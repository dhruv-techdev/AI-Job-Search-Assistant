import fs from "fs";
import { logger } from "../shared/logger.js";
import { loadJSON, saveJSON, saveFile, PATHS } from "../shared/tools.js";
import { callLLMWithRetry, extractJSON } from "../shared/llm.js";
import {
  GapAnalysisSchema,
  type Resume,
  type MarketAnalysis,
  type GapAnalysis,
} from "../shared/types.js";
import path from "path";

/**
 * ST-1: Loads resume and market analysis files. Throws if either is missing.
 */
export function loadRequiredFiles(): { resume: Resume; market: MarketAnalysis } {
  if (!fs.existsSync(PATHS.resumeData)) {
    throw new Error(
      "Resume data not found. Run 'npm run gaps <resume.pdf>' to extract your resume first."
    );
  }

  if (!fs.existsSync(PATHS.marketAnalysis)) {
    throw new Error(
      "Market analysis not found. Run 'npm run market' first to generate market analysis."
    );
  }

  const resume = loadJSON<Resume>(PATHS.resumeData);
  const market = loadJSON<MarketAnalysis>(PATHS.marketAnalysis);

  if (!resume || !market) {
    throw new Error("Failed to load required data files.");
  }

  logger.info("Loaded resume and market analysis data.");
  return { resume, market };
}

/**
 * ST-2: Compares candidate skills against market demand.
 */
function compareSkills(resume: Resume, market: MarketAnalysis) {
  const candidateSkills = new Set(
    [...resume.hardSkills, ...resume.softSkills]
      .map((s) => s.toLowerCase().trim())
  );

  // Also pull skills from work experience and projects
  for (const exp of resume.workExperience) {
    for (const skill of exp.skills) {
      candidateSkills.add(skill.toLowerCase().trim());
    }
  }
  for (const proj of resume.projects) {
    for (const skill of proj.skills) {
      candidateSkills.add(skill.toLowerCase().trim());
    }
  }

  const matchedSkills: string[] = [];
  const missingSkills: { skill: string; percentage: number }[] = [];

  for (const marketSkill of market.topRequiredSkills) {
    const skillLower = marketSkill.skill.toLowerCase();
    // Check for exact or partial match
    const found = [...candidateSkills].some(
      (cs) => cs === skillLower || cs.includes(skillLower) || skillLower.includes(cs)
    );

    if (found) {
      matchedSkills.push(marketSkill.skill);
    } else {
      missingSkills.push({ skill: marketSkill.skill, percentage: marketSkill.percentage });
    }
  }

  return { candidateSkills: [...candidateSkills], matchedSkills, missingSkills };
}

/**
 * ST-3: Compares experience and education against market demand.
 */
function compareExperienceAndEducation(resume: Resume, market: MarketAnalysis) {
  // Experience alignment
  const totalYears = resume.workExperience.length; // rough proxy
  const expLevels = market.experienceLevels;
  let experienceAlignment = "unknown";

  if (totalYears <= 1) experienceAlignment = "entry";
  else if (totalYears <= 3) experienceAlignment = "entry-to-mid";
  else if (totalYears <= 5) experienceAlignment = "mid";
  else experienceAlignment = "senior";

  const marketDemand =
    expLevels.entry >= expLevels.mid && expLevels.entry >= expLevels.senior
      ? "entry"
      : expLevels.mid >= expLevels.senior
        ? "mid"
        : "senior";

  // Education alignment
  const candidateEducation = resume.education.map((e) => e.degree.toLowerCase());
  const marketEducation = market.educationTrends.map((e) => e.toLowerCase());

  const educationMatches = marketEducation.filter((me) =>
    candidateEducation.some((ce) => ce.includes(me) || me.includes(ce))
  );

  return {
    experienceAlignment,
    marketDemand,
    educationMatches,
    marketEducation,
    candidateEducation,
  };
}

/**
 * Builds the LLM prompt for generating the full gap analysis.
 */
function buildGapAnalysisPrompt(
  resume: Resume,
  market: MarketAnalysis,
  skillComparison: ReturnType<typeof compareSkills>,
  expComparison: ReturnType<typeof compareExperienceAndEducation>
): string {
  return `You are a professional career advisor. Based on the following candidate resume data and job market analysis, generate a detailed gap analysis.

CANDIDATE PROFILE:
- Name: ${resume.candidateName}
- Hard Skills: ${resume.hardSkills.join(", ")}
- Soft Skills: ${resume.softSkills.join(", ")}
- Work Experience: ${resume.workExperience.map((e) => `${e.title} at ${e.company}`).join("; ")}
- Education: ${resume.education.map((e) => `${e.degree} from ${e.institution}`).join("; ")}
- Projects: ${resume.projects.map((p) => `${p.name}: ${p.skills.join(", ")}`).join("; ")}
- Certifications: ${resume.certifications.join(", ") || "None"}

MARKET ANALYSIS:
- Total postings analyzed: ${market.totalPostingsAnalyzed}
- Top required skills: ${market.topRequiredSkills.slice(0, 10).map((s) => `${s.skill} (${s.percentage}%)`).join(", ")}
- Experience demand: Entry=${market.experienceLevels.entry}, Mid=${market.experienceLevels.mid}, Senior=${market.experienceLevels.senior}
- Remote trends: Remote=${market.remoteWorkTrends.remote}, Hybrid=${market.remoteWorkTrends.hybrid}, Onsite=${market.remoteWorkTrends.onsite}

SKILL COMPARISON:
- Matched skills: ${skillComparison.matchedSkills.join(", ") || "None"}
- Missing skills: ${skillComparison.missingSkills.map((s) => `${s.skill} (${s.percentage}%)`).join(", ") || "None"}

EXPERIENCE COMPARISON:
- Candidate level: ${expComparison.experienceAlignment}
- Market demand: ${expComparison.marketDemand}
- Education matches: ${expComparison.educationMatches.join(", ") || "None found"}

RULES:
- Identify 3-6 genuine strengths with evidence from the resume
- Identify 4-8 gaps, classified as: quick_win (achievable in days), short_term (weeks), medium_term (1-3 months), long_term (3+ months)
- Each gap must have a specific actionPlan (not generic) and real learningResources (course names, platforms, books)
- Identify 2-4 unique value points that differentiate this candidate
- Generate an overallReadinessScore from 0-100 based on skill match percentage, experience alignment, and education fit
- Write a 2-3 sentence summary of the candidate's market position

Return ONLY valid JSON (no markdown, no backticks):

{
  "strengths": [
    { "skill": "string", "evidence": "string explaining where this appears in resume" }
  ],
  "gaps": [
    {
      "skill": "string",
      "level": "quick_win | short_term | medium_term | long_term",
      "description": "why this matters in the market",
      "actionPlan": "specific steps to close this gap",
      "learningResources": ["resource1", "resource2"]
    }
  ],
  "uniqueValuePoints": ["point1", "point2"],
  "overallReadinessScore": 0-100,
  "summary": "2-3 sentence market position summary",
  "generatedAt": "${new Date().toISOString()}"
}`;
}

/**
 * Generates the gap analysis using LLM with skill/experience comparison data.
 */
export async function generateGapAnalysis(
  resume: Resume,
  market: MarketAnalysis
): Promise<GapAnalysis> {
  // ST-2: Compare skills
  const skillComparison = compareSkills(resume, market);
  logger.info(`Skills matched: ${skillComparison.matchedSkills.length}`);
  logger.info(`Skills missing: ${skillComparison.missingSkills.length}`);

  // ST-3: Compare experience and education
  const expComparison = compareExperienceAndEducation(resume, market);
  logger.info(`Experience alignment: ${expComparison.experienceAlignment} (market wants: ${expComparison.marketDemand})`);
  logger.info(`Education matches: ${expComparison.educationMatches.length}`);

  // Build prompt and call LLM
  const prompt = buildGapAnalysisPrompt(resume, market, skillComparison, expComparison);
  const rawResponse = await callLLMWithRetry(prompt, {
    model: "primary",
    temperature: 0.3,
    maxTokens: 8192,
    fallbackModels: ["secondary"],
  });

  // Parse and validate
  const jsonStr = extractJSON(rawResponse);
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error(`LLM returned invalid JSON for gap analysis:\n${jsonStr.substring(0, 300)}`);
  }

  const result = GapAnalysisSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Gap analysis schema validation failed:\n${issues}`);
  }

  return result.data;
}

/**
 * Saves gap analysis as JSON.
 */
export function saveGapAnalysis(analysis: GapAnalysis): void {
  saveJSON(PATHS.gapAnalysis, analysis);
  logger.success(`Gap analysis saved: ${PATHS.gapAnalysis}`);
}

/**
 * Generates a Markdown gap analysis report.
 */
export function generateGapReport(analysis: GapAnalysis, resume: Resume): void {
  const reportPath = path.join(PATHS.reports, "gap-analysis.md");

  let md = `# Gap Analysis Report\n\n`;
  md += `**Candidate:** ${resume.candidateName}\n`;
  md += `**Generated:** ${new Date(analysis.generatedAt).toLocaleString()}\n`;
  md += `**Overall Readiness Score:** ${analysis.overallReadinessScore}/100\n\n`;
  md += `---\n\n`;

  // Summary
  md += `## Summary\n\n${analysis.summary}\n\n`;

  // Strengths
  md += `## Strengths\n\n`;
  for (const s of analysis.strengths) {
    md += `### ${s.skill}\n${s.evidence}\n\n`;
  }

  // Unique Value
  if (analysis.uniqueValuePoints.length > 0) {
    md += `## Unique Value Proposition\n\n`;
    for (const point of analysis.uniqueValuePoints) {
      md += `- ${point}\n`;
    }
    md += `\n`;
  }

  // Gaps by level
  const gapLevels = [
    { key: "quick_win", label: "Quick Wins (Days)" },
    { key: "short_term", label: "Short-Term Goals (Weeks)" },
    { key: "medium_term", label: "Medium-Term Goals (1-3 Months)" },
    { key: "long_term", label: "Long-Term Development (3+ Months)" },
  ] as const;

  md += `## Skill Gaps & Action Plans\n\n`;

  for (const { key, label } of gapLevels) {
    const gaps = analysis.gaps.filter((g) => g.level === key);
    if (gaps.length === 0) continue;

    md += `### ${label}\n\n`;
    for (const gap of gaps) {
      md += `#### ${gap.skill}\n`;
      md += `**Why it matters:** ${gap.description}\n\n`;
      md += `**Action plan:** ${gap.actionPlan}\n\n`;
      if (gap.learningResources.length > 0) {
        md += `**Resources:**\n`;
        for (const r of gap.learningResources) {
          md += `- ${r}\n`;
        }
      }
      md += `\n`;
    }
  }

  md += `---\n\n`;
  md += `*Report generated by AI Job Search Assistant*\n`;

  saveFile(reportPath, md);
  logger.success(`Gap analysis report saved: ${reportPath}`);
}
