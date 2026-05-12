import React from 'react';
import { motion } from 'framer-motion';

const stages = [
  { n: '01', t: 'Ingest PDFs', d: 'Scan the postings/ directory for job PDFs. pdf-parse extracts raw text, a pre-processor strips header/footer artifacts and normalizes whitespace, and a confidence check flags unusable files before they enter the pipeline.' },
  { n: '02', t: 'LLM Extraction', d: 'DeepSeek V3 converts each cleaned text blob into a structured JSON object with 20+ fields. A Zod schema validates every field on the first attempt; failures trigger a second-pass correction prompt that includes the exact Zod error message.' },
  { n: '03', t: 'Company Research', d: 'Tavily live web search runs against the company name and role. Returns company size, engineering culture signals, recent funding, and tech stack mentions. Results are merged into the job object before any analysis.' },
  { n: '04', t: 'Market Analysis', d: 'Aggregate all extracted postings into a market view: skill frequency rankings, salary percentile distribution, experience level breakdown (junior / mid / senior / staff), remote work patterns, and top education requirements.' },
  { n: '05', t: 'Resume Parsing', d: 'DeepSeek V3 extracts a structured candidate profile from the resume PDF — hard skills, soft skills, work experience with dates and scope, projects with outcomes, education, certifications, and self-reported seniority signals.' },
  { n: '06', t: 'Gap Analysis', d: 'Cross-reference the candidate profile against the full market dataset. Classify every missing skill by acquisition effort: quick wins, short-term, medium-term, and long-term. Generate concrete action plans and learning resources for each gap.' },
  { n: '07', t: 'Fit Scoring', d: 'Score the candidate 0–100 against a specific target posting. Each required skill is matched (present), partial (adjacent experience), or gap (absent). Fit band classification: Strong Fit / Good Fit / Stretch / Growth Target.' },
  { n: '08', t: 'Report Generation', d: 'Four parallel outputs: (1) JSON data file, (2) Markdown report for any editor, (3) self-contained HTML with score gauge and skill grid, (4) cover letter draft. All three formats are written atomically — no partial reports.' },
];

export default function Workflow() {
  return (
    <section id="workflow" className="mob-section-pad" style={{ padding: '7rem 2rem', maxWidth: 860, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.6 }}
        style={{ marginBottom: '3.5rem' }}
      >
        <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-2)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '1rem' }}>
          Pipeline
        </div>
        <h2 style={{ fontSize: '2.2rem', fontWeight: 700, letterSpacing: '-1.5px', color: 'var(--text-1)' }}>
          8-Stage workflow
        </h2>
      </motion.div>

      <div style={{ position: 'relative' }}>
        <div style={{
          position: 'absolute', left: 27, top: 0, bottom: 0, width: 1,
          background: 'var(--border)', opacity: 1,
        }} />

        {stages.map((s, i) => (
          <motion.div key={s.n}
            initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ delay: i * 0.06, duration: 0.5 }}
            style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', marginBottom: '2rem', position: 'relative' }}
          >
            <div style={{
              width: 54, height: 54, borderRadius: 2,
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-mono)', fontWeight: 500, fontSize: '0.75rem',
              color: 'var(--text-2)', flexShrink: 0,
            }}>
              {s.n}
            </div>
            <div style={{ paddingTop: 8 }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--text-1)', letterSpacing: '-0.2px' }}>{s.t}</h3>
              <p style={{ color: 'var(--text-2)', fontSize: '0.88rem', fontFamily: 'var(--font-body)', lineHeight: 1.7, fontWeight: 400 }}>{s.d}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
