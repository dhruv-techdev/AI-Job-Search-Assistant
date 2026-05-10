import { logger } from "../shared/logger.js";
import { callLLMWithRetry, extractJSON } from "../shared/llm.js";
import type { JobPosting, Resume, ApplicationReport } from "../shared/types.js";
import { z } from "zod";

const ResumeAdaptationsSchema = z.array(
  z.object({
    section: z.string().min(1),
    currentContent: z.string().min(1),
    suggestedChange: z.string().min(1),
    rationale: z.string().min(1),
  })
).min(3).max(5);

function buildResumeAdaptationPrompt(job: JobPosting, resume: Resume): string {
  return `You are a professional resume consultant. Generate 4-6 specific resume adaptation suggestions for this candidate applying to this job.

TARGET JOB:
- Title: ${job.jobTitle}
- Company: ${job.companyName}
- Required Skills: ${job.requiredSkills.join(", ")}
- Preferred Skills: ${job.preferredSkills.join(", ")}
- Responsibilities: ${job.responsibilities.join("; ")}
- Seniority: ${job.seniorityLevel}
- Education: ${job.educationRequirements.join(", ") || "Not specified"}

CANDIDATE RESUME:
- Summary: ${resume.professionalSummary || "None"}
- Hard Skills: ${resume.hardSkills.join(", ")}
- Soft Skills: ${resume.softSkills.join(", ")}
- Work Experience:
${resume.workExperience.map((e) => `  * ${e.title} at ${e.company} (${e.duration || "N/A"})\n    Responsibilities: ${e.responsibilities.slice(0, 3).join("; ")}\n    Skills: ${e.skills.join(", ")}`).join("\n")}
- Projects:
${resume.projects.map((p) => `  * ${p.name}: ${p.description} (${p.skills.join(", ")})`).join("\n")}
- Education: ${resume.education.map((e) => `${e.degree} from ${e.institution}`).join("; ")}
- Certifications: ${resume.certifications.join(", ") || "None"}

RULES:
- Generate exactly 3-5 suggestions
- Each suggestion must reference a SPECIFIC section of the resume (e.g., "Professional Summary", "Work Experience - [Company]", "Skills Section", "Projects - [Project Name]")
- currentContent must quote or describe what the resume currently says in that section
- suggestedChange must give the EXACT new wording or specific additions, not vague advice
- rationale must explain WHY this change improves the application for THIS specific job
- Prioritize changes that improve ATS keyword matching and recruiter relevance
- Focus on: keyword alignment, quantifying achievements, reordering skills, tailoring the summary, highlighting relevant projects
- Do NOT suggest adding skills the candidate doesn't have — only reframe existing experience

Return ONLY valid JSON array (no markdown, no backticks):

[
  {
    "section": "specific resume section name",
    "currentContent": "what the resume currently says or describes",
    "suggestedChange": "exact new wording or specific addition",
    "rationale": "why this change helps for this specific job"
  }
]`;
}

/**
 * Generates 4-6 targeted resume adaptation suggestions.
 */
export async function generateResumeAdaptations(
  job: JobPosting,
  resume: Resume
): Promise<ApplicationReport["resumeAdaptations"]> {
  logger.debug("Generating resume adaptation suggestions...");

  const prompt = buildResumeAdaptationPrompt(job, resume);
  const rawResponse = await callLLMWithRetry(prompt, {
    model: "primary",
    temperature: 0.3,
    maxTokens: 8192,
    fallbackModels: ["secondary", "creative"],
  });

  const jsonStr = extractJSON(rawResponse);
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error(`LLM returned invalid JSON for resume adaptations:\n${jsonStr.substring(0, 300)}`);
  }

  const result = ResumeAdaptationsSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Resume adaptations validation failed: ${issues}`);
  }

  return result.data;
}
