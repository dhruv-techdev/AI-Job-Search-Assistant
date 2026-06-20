import { z } from "zod";

// ========== Job Posting Schema ==========

export const JobPostingSchema = z.object({
  id: z.string().describe("Unique identifier derived from filename"),
  jobTitle: z.string().min(1).describe("Job title"),
  companyName: z.string().min(1).describe("Company name"),
  location: z.string().nullable().describe("Job location or null if not listed"),
  remoteStatus: z
    .enum(["remote", "hybrid", "onsite", "not_listed"])
    .describe("Remote work status"),
  requiredSkills: z
    .array(z.string())
    .min(1)
    .describe("Skills explicitly required"),
  preferredSkills: z
    .array(z.string())
    .describe("Skills listed as preferred or nice-to-have"),
  experienceYears: z
    .number()
    .nullable()
    .describe("Minimum years of experience required, or null"),
  seniorityLevel: z
    .enum(["intern", "entry", "mid", "senior", "lead", "manager", "not_listed"])
    .describe("Seniority level"),
  educationRequirements: z
    .array(z.string())
    .describe("Education requirements listed"),
  salaryMin: z.number().nullable().describe("Minimum salary or null"),
  salaryMax: z.number().nullable().describe("Maximum salary or null"),
  salaryCurrency: z
    .string()
    .nullable()
    .describe("Salary currency code (e.g. CAD, USD) or null"),
  responsibilities: z
    .array(z.string())
    .min(1)
    .describe("Key job responsibilities"),
  companyResearch: z
    .object({
      companySize: z.string().nullable(),
      recentNews: z.array(z.string()),
      cultureSignals: z.array(z.string()),
    })
    .nullable()
    .describe("Company research data, null if not yet researched"),
  extractedAt: z.string().describe("ISO timestamp of extraction"),
  sourceFile: z.string().describe("Original PDF filename"),
});

export type JobPosting = z.infer<typeof JobPostingSchema>;

// ========== Resume Schema ==========

/**
 * A required text field that tolerates the null/undefined free LLMs emit for
 * "not found", coercing to a fallback so one missing field doesn't reject the
 * whole resume. Output type stays `string`, so downstream code is unaffected.
 */
const llmString = (fallback: string) =>
  z
    .string()
    .nullish()
    .transform((v) => (v && v.trim() ? v : fallback));

export const ResumeSchema = z.object({
  candidateName: z.string().min(1),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  location: z.string().nullable(),
  professionalSummary: z.string().nullable(),
  hardSkills: z.array(z.string()),
  softSkills: z.array(z.string()),
  workExperience: z.array(
    z.object({
      title: llmString("Unknown Role"),
      company: llmString("Unknown Company"),
      duration: z.string().nullable(),
      responsibilities: z.array(z.string()),
      skills: z.array(z.string()),
    })
  ),
  education: z.array(
    z.object({
      degree: llmString("Unknown Degree"),
      institution: llmString("Unknown Institution"),
      year: z.string().nullable(),
    })
  ),
  certifications: z.array(z.string()),
  projects: z.array(
    z.object({
      name: llmString("Untitled Project"),
      description: llmString(""),
      skills: z.array(z.string()),
    })
  ),
  keywords: z.array(z.string()),
  extractedAt: z.string(),
});

export type Resume = z.infer<typeof ResumeSchema>;

// ========== Market Analysis Schema ==========

export const MarketAnalysisSchema = z.object({
  totalPostingsAnalyzed: z.number(),
  topRequiredSkills: z.array(
    z.object({ skill: z.string(), count: z.number(), percentage: z.number() })
  ),
  topPreferredSkills: z.array(
    z.object({ skill: z.string(), count: z.number(), percentage: z.number() })
  ),
  experienceLevels: z.object({
    entry: z.number(),
    mid: z.number(),
    senior: z.number(),
  }),
  salaryRange: z
    .object({
      min: z.number().nullable(),
      max: z.number().nullable(),
      currency: z.string().nullable(),
    })
    .nullable(),
  commonResponsibilities: z.array(z.string()),
  educationTrends: z.array(z.string()),
  remoteWorkTrends: z.object({
    remote: z.number(),
    hybrid: z.number(),
    onsite: z.number(),
    notListed: z.number(),
  }),
  industryInsights: z.array(z.string()),
  generatedAt: z.string(),
});

export type MarketAnalysis = z.infer<typeof MarketAnalysisSchema>;

// ========== Gap Analysis Schema ==========

export const GapAnalysisSchema = z.object({
  strengths: z.array(
    z.object({ skill: z.string(), evidence: z.string() })
  ),
  gaps: z.array(
    z.object({
      skill: z.string(),
      level: z.enum(["quick_win", "short_term", "medium_term", "long_term"]),
      description: z.string(),
      actionPlan: z.string(),
      learningResources: z.array(z.string()),
    })
  ),
  uniqueValuePoints: z.array(z.string()),
  overallReadinessScore: z.number().min(0).max(100),
  summary: z.string(),
  generatedAt: z.string(),
});

export type GapAnalysis = z.infer<typeof GapAnalysisSchema>;

// ========== Application Report Schema ==========

export const ApplicationReportSchema = z.object({
  jobTitle: z.string(),
  companyName: z.string(),
  fitAssessment: z.object({
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
  }),
  resumeAdaptations: z.array(
    z.object({
      section: z.string(),
      currentContent: z.string(),
      suggestedChange: z.string(),
      rationale: z.string(),
    })
  ),
  coverLetterGuidance: z.object({
    keyPoints: z.array(z.string()),
    strengthsToEmphasize: z.array(z.string()),
    gapsToAddress: z.array(z.string()),
    companyAngles: z.array(z.string()),
  }),
  interviewPreparation: z.object({
    likelyQuestions: z.array(
      z.object({ question: z.string(), suggestedApproach: z.string() })
    ),
    skillsToReview: z.array(z.string()),
    companyResearchPoints: z.array(z.string()),
    talkingPoints: z.array(z.string()),
  }),
  generatedAt: z.string(),
});

export type ApplicationReport = z.infer<typeof ApplicationReportSchema>;
