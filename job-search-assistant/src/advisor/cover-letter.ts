import path from "path";
import { logger } from "../shared/logger.js";
import { callLLMWithRetry, extractJSON } from "../shared/llm.js";
import { saveFile, PATHS } from "../shared/tools.js";
import type { JobPosting, Resume, ApplicationReport } from "../shared/types.js";
import { z } from "zod";

// ST-1: Schema for cover letter guidance
const CoverLetterGuidanceSchema = z.object({
  keyPoints: z.array(z.string()).min(3),
  strengthsToEmphasize: z.array(z.string()).min(2),
  gapsToAddress: z.array(z.string()),
  companyAngles: z.array(z.string()).min(1),
});

// ST-3: Schema for full cover letter
const CoverLetterDraftSchema = z.object({
  coverLetter: z.string().min(200),
});

/**
 * ST-1: Generates cover letter key points, strengths, gaps to address, and company angles.
 */
export async function generateCoverLetterGuidance(
  job: JobPosting,
  resume: Resume
): Promise<ApplicationReport["coverLetterGuidance"]> {
  const prompt = `You are a professional cover letter strategist. Generate cover letter guidance for this candidate applying to this job.

TARGET JOB:
- Title: ${job.jobTitle}
- Company: ${job.companyName}
- Required Skills: ${job.requiredSkills.join(", ")}
- Preferred Skills: ${job.preferredSkills.join(", ")}
- Responsibilities: ${job.responsibilities.slice(0, 5).join("; ")}
${job.companyResearch ? `- Company Size: ${job.companyResearch.companySize || "Unknown"}
- Culture: ${job.companyResearch.cultureSignals.join(", ") || "Unknown"}
- Recent News: ${job.companyResearch.recentNews.slice(0, 2).join("; ") || "None"}` : ""}

CANDIDATE:
- Name: ${resume.candidateName}
- Summary: ${resume.professionalSummary || "None"}
- Key Skills: ${resume.hardSkills.slice(0, 10).join(", ")}
- Experience: ${resume.workExperience.map((e) => `${e.title} at ${e.company}`).join("; ")}
- Projects: ${resume.projects.map((p) => `${p.name} (${p.skills.join(", ")})`).join("; ")}

RULES:
- keyPoints: 3-5 main points the cover letter should make (specific to this job)
- strengthsToEmphasize: 2-4 candidate strengths that directly match job requirements
- gapsToAddress: any skill gaps that should be addressed positively (show willingness to learn, transferable skills)
- companyAngles: 1-3 company-specific angles to show genuine interest (use company research if available)

Return ONLY valid JSON (no markdown, no backticks):

{
  "keyPoints": ["point1", "point2", "point3"],
  "strengthsToEmphasize": ["strength1", "strength2"],
  "gapsToAddress": ["how to address gap1 positively"],
  "companyAngles": ["company-specific angle1"]
}`;

  const rawResponse = await callLLMWithRetry(prompt, {
    model: "primary",
    temperature: 0.3,
    maxTokens: 2048,
    jsonMode: true,
    fallbackModels: ["secondary"],
  });

  const jsonStr = extractJSON(rawResponse);
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error(`LLM returned invalid JSON for cover letter guidance:\n${jsonStr.substring(0, 300)}`);
  }

  let result = CoverLetterGuidanceSchema.safeParse(parsed);

  if (!result.success) {
    // Normalize snake_case keys that free models commonly return
    const obj = parsed as Record<string, unknown>;
    const normalized = {
      keyPoints: obj.keyPoints ?? obj.key_points ?? obj.points ?? obj.main_points,
      strengthsToEmphasize: obj.strengthsToEmphasize ?? obj.strengths_to_emphasize ?? obj.strengths,
      gapsToAddress: obj.gapsToAddress ?? obj.gaps_to_address ?? obj.gaps ?? [],
      companyAngles: obj.companyAngles ?? obj.company_angles ?? obj.angles ?? obj.company_specific_angles,
    };
    result = CoverLetterGuidanceSchema.safeParse(normalized);
  }

  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    logger.debug(`Cover letter guidance raw response: ${jsonStr.substring(0, 500)}`);
    throw new Error(`Cover letter guidance validation failed: ${issues}`);
  }

  return result.data;
}

/**
 * ST-2 & ST-3: Generates a full professional cover letter draft (250-350 words).
 */
export async function generateCoverLetterDraft(
  job: JobPosting,
  resume: Resume,
  guidance: ApplicationReport["coverLetterGuidance"],
  tone: "professional" | "enthusiastic" = "professional"
): Promise<string> {
  const prompt = `You are an expert cover letter writer. Write a complete cover letter for this candidate applying to this job.

TARGET JOB:
- Title: ${job.jobTitle}
- Company: ${job.companyName}
- Location: ${job.location || "Not listed"}
- Required Skills: ${job.requiredSkills.join(", ")}
- Responsibilities: ${job.responsibilities.slice(0, 5).join("; ")}
${job.companyResearch ? `- Company Culture: ${job.companyResearch.cultureSignals.join(", ") || "Unknown"}` : ""}

CANDIDATE:
- Name: ${resume.candidateName}
- Email: ${resume.email || "Not provided"}
- Phone: ${resume.phone || "Not provided"}
- Location: ${resume.location || "Not provided"}
- Summary: ${resume.professionalSummary || "None"}
- Key Skills: ${resume.hardSkills.join(", ")}
- Experience: ${resume.workExperience.map((e) => `${e.title} at ${e.company} (${e.duration || "N/A"}): ${e.responsibilities.slice(0, 2).join("; ")}`).join("\n  ")}
- Projects: ${resume.projects.map((p) => `${p.name}: ${p.description}`).join("; ")}
- Education: ${resume.education.map((e) => `${e.degree} from ${e.institution}`).join("; ")}

COVER LETTER STRATEGY:
- Key points to make: ${guidance.keyPoints.join("; ")}
- Strengths to emphasize: ${guidance.strengthsToEmphasize.join("; ")}
- Gaps to address positively: ${guidance.gapsToAddress.join("; ") || "None"}
- Company angles: ${guidance.companyAngles.join("; ")}

RULES:
- Tone: ${tone}
- Length: 250-350 words (STRICT — count carefully)
- Include proper greeting and sign-off
- First paragraph: hook with enthusiasm for the role and company
- Middle paragraphs: connect candidate experience to job requirements with specific examples
- Address any gaps positively (show transferable skills, eagerness to learn)
- Final paragraph: express interest, call to action
- Do NOT use generic phrases like "I am writing to apply for" — be specific and engaging
- Reference the company by name and show you know what they do
- Use the candidate's actual experience — do NOT invent achievements

Return ONLY valid JSON (no markdown, no backticks):

{
  "coverLetter": "Dear Hiring Manager,\\n\\n..."
}`;

  const rawResponse = await callLLMWithRetry(prompt, {
    model: "creative",
    temperature: 0.5,
    maxTokens: 2048,
    jsonMode: true,
    fallbackModels: ["primary"],
  });

  const jsonStr = extractJSON(rawResponse);
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    // Model returned plain text — use it directly if long enough
    if (rawResponse.trim().length >= 200) {
      return rawResponse.trim();
    }
    throw new Error(`LLM returned invalid JSON for cover letter:\n${jsonStr.substring(0, 300)}`);
  }

  const result = CoverLetterDraftSchema.safeParse(parsed);
  if (!result.success) {
    // Try common alternative key names free models use
    const obj = parsed as Record<string, unknown>;
    const alt = obj.cover_letter ?? obj.letter ?? obj.text ?? obj.content ?? obj.body;
    if (typeof alt === "string" && alt.length >= 200) {
      return alt;
    }
    const issues = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    logger.debug(`Cover letter draft raw response: ${jsonStr.substring(0, 500)}`);
    throw new Error(`Cover letter draft validation failed: ${issues}`);
  }

  return result.data.coverLetter;
}

/**
 * ST-4: Saves cover letter as a Markdown file.
 */
export function saveCoverLetter(
  coverLetter: string,
  job: JobPosting,
  outputName: string
): void {
  let md = `# Cover Letter\n\n`;
  md += `**Position:** ${job.jobTitle}\n`;
  md += `**Company:** ${job.companyName}\n`;
  md += `**Generated:** ${new Date().toLocaleString()}\n\n`;
  md += `---\n\n`;
  md += coverLetter;
  md += `\n\n---\n\n`;
  md += `*Generated by AI Job Search Assistant — review and personalize before sending*\n`;

  const filePath = path.join(PATHS.reports, `cover-letter-${outputName}.md`);
  saveFile(filePath, md);
  logger.success(`Cover letter saved: ${filePath}`);
}
