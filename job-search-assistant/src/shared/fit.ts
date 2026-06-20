export type Recommendation =
  | "strong_fit"
  | "good_fit"
  | "stretch"
  | "growth_target";

/**
 * Single source of truth for the fit-score → recommendation mapping.
 * The LLM is instructed with these exact cutoffs (see buildFitAssessmentPrompt),
 * and the eval harness and HTML gauge derive from them so all three stay in sync.
 */
export const FIT_THRESHOLDS = {
  strong_fit: 85,
  good_fit: 65,
  stretch: 45,
} as const;

export function classifyFit(score: number): Recommendation {
  if (score >= FIT_THRESHOLDS.strong_fit) return "strong_fit";
  if (score >= FIT_THRESHOLDS.good_fit) return "good_fit";
  if (score >= FIT_THRESHOLDS.stretch) return "stretch";
  return "growth_target";
}
