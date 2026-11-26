import path from "path";
import { logger } from "../shared/logger.js";
import { saveFile, PATHS } from "../shared/tools.js";
import { classifyFit } from "../shared/fit.js";
import type { ApplicationReport } from "../shared/types.js";

function getScoreColor(score: number): string {
  switch (classifyFit(score)) {
    case "strong_fit": return "#22c55e";
    case "good_fit": return "#3b82f6";
    case "stretch": return "#f59e0b";
    default: return "#ef4444";
  }
}

function getRecLabel(rec: string): string {
  const labels: Record<string, string> = {
    strong_fit: "Strong Fit",
    good_fit: "Good Fit",
    stretch: "Stretch",
    growth_target: "Growth Target",
  };
  return labels[rec] || rec;
}

function getStatusColor(status: string): string {
  if (status === "match") return "#22c55e";
  if (status === "partial") return "#f59e0b";
  return "#ef4444";
}

function getStatusIcon(status: string): string {
  if (status === "match") return "✅";
  if (status === "partial") return "🔶";
  return "❌";
}

/**
 * Generates a self-contained HTML application report.
 */
export function generateApplicationHTMLReport(
  report: ApplicationReport,
  outputName: string
): void {
  const filePath = path.join(PATHS.reports, `application-${outputName}.html`);
  const fit = report.fitAssessment;
  const scoreColor = getScoreColor(fit.overallScore);
  const matchCount = fit.skillMatches.filter((s) => s.status === "match").length;
  const partialCount = fit.skillMatches.filter((s) => s.status === "partial").length;
  const gapCount = fit.skillMatches.filter((s) => s.status === "gap").length;
  const totalSkills = fit.skillMatches.length;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Report — ${report.jobTitle} at ${report.companyName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #e2e8f0; line-height: 1.6; padding: 2rem; }
    .container { max-width: 900px; margin: 0 auto; }
    h1 { font-size: 1.8rem; color: #f8fafc; margin-bottom: 0.25rem; }
    h2 { font-size: 1.3rem; color: #94a3b8; margin-top: 2.5rem; margin-bottom: 1rem; border-bottom: 1px solid #1e293b; padding-bottom: 0.5rem; }
    h3 { font-size: 1.1rem; color: #cbd5e1; margin-top: 1.5rem; margin-bottom: 0.75rem; }
    .subtitle { color: #64748b; font-size: 0.95rem; margin-bottom: 2rem; }
    .card { background: #1e293b; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; border: 1px solid #334155; }

    /* Fit Score Gauge */
    .score-section { display: flex; align-items: center; gap: 2rem; flex-wrap: wrap; }
    .gauge-container { position: relative; width: 160px; height: 160px; }
    .gauge-bg { fill: none; stroke: #334155; stroke-width: 12; }
    .gauge-fill { fill: none; stroke: ${scoreColor}; stroke-width: 12; stroke-linecap: round; transition: stroke-dashoffset 1s ease; }
    .gauge-text { font-size: 2.5rem; font-weight: 700; fill: ${scoreColor}; text-anchor: middle; dominant-baseline: central; }
    .gauge-label { font-size: 0.75rem; fill: #94a3b8; text-anchor: middle; }
    .score-details { flex: 1; min-width: 250px; }
    .rec-badge { display: inline-block; padding: 0.35rem 1rem; border-radius: 20px; font-weight: 600; font-size: 0.9rem; background: ${scoreColor}22; color: ${scoreColor}; border: 1px solid ${scoreColor}44; margin-bottom: 1rem; }
    .rec-text { color: #94a3b8; font-size: 0.95rem; }

    /* Skill Bars */
    .skill-summary { display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
    .skill-stat { flex: 1; min-width: 100px; text-align: center; padding: 0.75rem; border-radius: 8px; background: #0f172a; }
    .skill-stat-num { font-size: 1.5rem; font-weight: 700; }
    .skill-stat-label { font-size: 0.75rem; color: #64748b; text-transform: uppercase; }
    .skill-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem 0; border-bottom: 1px solid #1e293b; }
    .skill-item:last-child { border-bottom: none; }
    .skill-name { flex: 1; font-size: 0.9rem; }
    .skill-badge { padding: 0.2rem 0.6rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600; }
    .skill-note { color: #64748b; font-size: 0.8rem; flex: 2; }
    .match { background: #22c55e22; color: #22c55e; }
    .partial { background: #f59e0b22; color: #f59e0b; }
    .gap { background: #ef444422; color: #ef4444; }

    /* Resume Suggestions */
    .suggestion { margin-bottom: 1.25rem; padding-bottom: 1.25rem; border-bottom: 1px solid #334155; }
    .suggestion:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
    .suggestion-section { color: #3b82f6; font-weight: 600; font-size: 0.9rem; margin-bottom: 0.5rem; }
    .suggestion-label { font-size: 0.75rem; color: #64748b; text-transform: uppercase; margin-top: 0.5rem; }
    .suggestion-content { font-size: 0.9rem; color: #cbd5e1; margin-top: 0.25rem; }

    /* Cover Letter */
    .cl-list { list-style: none; }
    .cl-list li { padding: 0.4rem 0; padding-left: 1.5rem; position: relative; font-size: 0.9rem; }
    .cl-list li::before { content: attr(data-icon); position: absolute; left: 0; }

    /* Interview */
    .question { margin-bottom: 1.25rem; }
    .question-text { font-weight: 600; color: #f8fafc; font-size: 0.95rem; margin-bottom: 0.35rem; }
    .question-approach { color: #94a3b8; font-size: 0.9rem; padding-left: 1rem; border-left: 2px solid #3b82f6; }
    .tag-list { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem; }
    .tag { padding: 0.3rem 0.75rem; border-radius: 16px; font-size: 0.8rem; background: #334155; color: #cbd5e1; }

    .footer { text-align: center; color: #475569; font-size: 0.8rem; margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid #1e293b; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${report.jobTitle}</h1>
    <p class="subtitle">${report.companyName} — Generated ${new Date(report.generatedAt).toLocaleString()}</p>

    <!-- Fit Score -->
    <div class="card">
      <div class="score-section">
        <div class="gauge-container">
          <svg viewBox="0 0 160 160">
            <circle class="gauge-bg" cx="80" cy="80" r="65" />
            <circle class="gauge-fill" cx="80" cy="80" r="65"
              stroke-dasharray="${2 * Math.PI * 65}"
              stroke-dashoffset="${2 * Math.PI * 65 * (1 - fit.overallScore / 100)}"
              transform="rotate(-90 80 80)" />
            <text class="gauge-text" x="80" y="75">${fit.overallScore}</text>
            <text class="gauge-label" x="80" y="100">out of 100</text>
          </svg>
        </div>
        <div class="score-details">
          <div class="rec-badge">${getRecLabel(fit.recommendation)}</div>
          <p class="rec-text">${fit.recommendationText}</p>
          <p style="margin-top: 0.75rem; font-size: 0.85rem; color: #64748b;">
            <strong>Experience:</strong> ${fit.experienceMatch}<br>
            <strong>Education:</strong> ${fit.educationMatch}
          </p>
        </div>
      </div>
    </div>

    <!-- Skill Match -->
    <h2>Skill Match Breakdown</h2>
    <div class="card">
      <div class="skill-summary">
        <div class="skill-stat">
          <div class="skill-stat-num" style="color: #22c55e;">${matchCount}</div>
          <div class="skill-stat-label">Match</div>
        </div>
        <div class="skill-stat">
          <div class="skill-stat-num" style="color: #f59e0b;">${partialCount}</div>
          <div class="skill-stat-label">Partial</div>
        </div>
        <div class="skill-stat">
          <div class="skill-stat-num" style="color: #ef4444;">${gapCount}</div>
          <div class="skill-stat-label">Gap</div>
        </div>
        <div class="skill-stat">
          <div class="skill-stat-num" style="color: #3b82f6;">${totalSkills}</div>
          <div class="skill-stat-label">Total</div>
        </div>
      </div>
      ${fit.skillMatches.map((s) => `
      <div class="skill-item">
        <span>${getStatusIcon(s.status)}</span>
        <span class="skill-name">${s.skill}</span>
        <span class="skill-badge ${s.status}">${s.status}</span>
        <span class="skill-note">${s.note}</span>
      </div>`).join("")}
    </div>

    <!-- Resume Suggestions -->
    ${report.resumeAdaptations.length > 0 ? `
    <h2>Resume Adaptation Suggestions</h2>
    <div class="card">
      ${report.resumeAdaptations.map((s, i) => `
      <div class="suggestion">
        <div class="suggestion-section">${i + 1}. ${s.section}</div>
        <div class="suggestion-label">Current</div>
        <div class="suggestion-content">${s.currentContent}</div>
        <div class="suggestion-label">Suggested Change</div>
        <div class="suggestion-content" style="color: #22c55e;">${s.suggestedChange}</div>
        <div class="suggestion-label">Rationale</div>
        <div class="suggestion-content">${s.rationale}</div>
      </div>`).join("")}
    </div>` : ""}

    <!-- Cover Letter Strategy -->
    ${report.coverLetterGuidance.keyPoints.length > 0 ? `
    <h2>Cover Letter Strategy</h2>
    <div class="card">
      <h3>Key Points</h3>
      <ul class="cl-list">${report.coverLetterGuidance.keyPoints.map((p) => `<li data-icon="•">${p}</li>`).join("")}</ul>
      <h3>Strengths to Emphasize</h3>
      <ul class="cl-list">${report.coverLetterGuidance.strengthsToEmphasize.map((s) => `<li data-icon="✓">${s}</li>`).join("")}</ul>
      ${report.coverLetterGuidance.gapsToAddress.length > 0 ? `
      <h3>Gaps to Address</h3>
      <ul class="cl-list">${report.coverLetterGuidance.gapsToAddress.map((g) => `<li data-icon="→">${g}</li>`).join("")}</ul>` : ""}
      <h3>Company Angles</h3>
      <ul class="cl-list">${report.coverLetterGuidance.companyAngles.map((a) => `<li data-icon="🏢">${a}</li>`).join("")}</ul>
    </div>` : ""}

    <!-- Interview Preparation -->
    ${report.interviewPreparation.likelyQuestions.length > 0 ? `
    <h2>Interview Preparation</h2>
    <div class="card">
      <h3>Likely Questions</h3>
      ${report.interviewPreparation.likelyQuestions.map((q, i) => `
      <div class="question">
        <div class="question-text">${i + 1}. ${q.question}</div>
        <div class="question-approach">${q.suggestedApproach}</div>
      </div>`).join("")}

      <h3>Skills to Review</h3>
      <div class="tag-list">${report.interviewPreparation.skillsToReview.map((s) => `<span class="tag">📖 ${s}</span>`).join("")}</div>

      <h3>Company Research Points</h3>
      <div class="tag-list">${report.interviewPreparation.companyResearchPoints.map((p) => `<span class="tag">🔍 ${p}</span>`).join("")}</div>

      <h3>Talking Points</h3>
      <ul class="cl-list">${report.interviewPreparation.talkingPoints.map((t) => `<li data-icon="💬">${t}</li>`).join("")}</ul>
    </div>` : ""}

    <div class="footer">
      <p>Generated by AI Job Search Assistant</p>
      <p>Review and personalize all content before using in real applications.</p>
    </div>
  </div>
</body>
</html>`;

  saveFile(filePath, html);
  logger.success(`HTML report saved: ${filePath}`);
}
