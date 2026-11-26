import { logger } from "../shared/logger.js";
import { callLLMWithRetry, parseJSONLoose } from "../shared/llm.js";
import type { JobPosting, Resume, ApplicationReport } from "../shared/types.js";
import { z } from "zod";

const InterviewPrepSchema = z.object({
  likelyQuestions: z
    .array(
      z.object({
        question: z.string().min(1),
        suggestedApproach: z.string().min(1),
      })
    )
    .min(5)
    .max(7),
  skillsToReview: z.array(z.string()).min(3),
  companyResearchPoints: z.array(z.string()).min(2),
  talkingPoints: z.array(z.string()).min(3),
});

/**
 * Generates interview preparation guidance for a target job.
 */
export async function generateInterviewPrep(
  job: JobPosting,
  resume: Resume
): Promise<ApplicationReport["interviewPreparation"]> {
  const prompt = `You are a professional interview coach. Generate interview preparation guidance for this candidate applying to this specific job.

TARGET JOB:
- Title: ${job.jobTitle}
- Company: ${job.companyName}
- Required Skills: ${job.requiredSkills.join(", ")}
- Preferred Skills: ${job.preferredSkills.join(", ")}
- Seniority: ${job.seniorityLevel}
- Responsibilities: ${job.responsibilities.join("; ")}
${job.companyResearch ? `- Company Size: ${job.companyResearch.companySize || "Unknown"}
- Culture: ${job.companyResearch.cultureSignals.join(", ") || "Unknown"}
- Recent News: ${job.companyResearch.recentNews.slice(0, 3).join("; ") || "None"}` : ""}

CANDIDATE:
- Name: ${resume.candidateName}
- Skills: ${resume.hardSkills.join(", ")}
- Experience: ${resume.workExperience.map((e) => `${e.title} at ${e.company}: ${e.responsibilities.slice(0, 2).join("; ")}`).join(" | ")}
- Projects: ${resume.projects.map((p) => `${p.name} (${p.skills.join(", ")})`).join("; ")}
- Education: ${resume.education.map((e) => `${e.degree} from ${e.institution}`).join("; ")}

RULES:
- Generate 5-7 likely interview questions specific to THIS role (not generic questions)
- Each question must have a suggestedApproach: a practical strategy for answering using the candidate's actual experience (reference specific projects, roles, or skills from their resume)
- skillsToReview: 3-6 technical or domain skills the candidate should brush up on before the interview
- companyResearchPoints: 2-4 things the candidate should research about the company (products, culture, recent news, competitors)
- talkingPoints: 3-5 strong talking points that connect the candidate's experience to what this role needs (use STAR format hints where appropriate)
- Mix question types: technical, behavioral, situational, and role-specific
- Be specific — reference the actual job requirements and candidate background

Return ONLY valid JSON (no markdown, no backticks):

{
  "likelyQuestions": [
    {
      "question": "specific interview question",
      "suggestedApproach": "how to answer using candidate's actual experience"
    }
  ],
  "skillsToReview": ["skill1", "skill2", "skill3"],
  "companyResearchPoints": ["point1", "point2"],
  "talkingPoints": ["talking point connecting experience to role"]
}`;

  const rawResponse = await callLLMWithRetry(prompt, {
    model: "primary",
    temperature: 0.3,
    maxTokens: 4096,
    jsonMode: true,
    fallbackModels: ["secondary"],
  });

  let parsed: unknown;
  try {
    parsed = parseJSONLoose(rawResponse);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(`LLM returned invalid JSON for interview prep: ${detail}`);
  }

  const result = InterviewPrepSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Interview prep validation failed: ${issues}`);
  }

  return result.data;
}
