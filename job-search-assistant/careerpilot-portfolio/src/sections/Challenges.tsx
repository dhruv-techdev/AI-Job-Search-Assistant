import React from 'react';
import { motion } from 'framer-motion';

const challenges = [
  {
    n: '01',
    problem: 'PDF parsing variability',
    detail: 'Job posting PDFs ranged from cleanly exported Word docs to scanned images with headers and footers mixed into the body text. pdf-parse returns raw strings with no structure — meaning every posting arrived in a different format.',
    solution: 'Wrote a pre-processing step that strips common header/footer artifacts, normalizes whitespace, and segments the text into logical blocks before handing it to the LLM. Added a fallback that sends the raw text if segmentation confidence is low.',
    tag: 'Data Ingestion',
  },
  {
    n: '02',
    problem: 'Getting consistent JSON out of LLMs',
    detail: "LLMs hallucinate field names, wrap JSON in markdown code fences, truncate large arrays, or emit trailing commas. A single malformed response would crash the downstream Zod validation and stall the pipeline.",
    solution: 'Implemented a two-pass prompt strategy: the first pass asks for JSON, the second (on Zod failure) sends the error message back and asks for a corrected response. Added JSON extraction regex to strip markdown fences and a recursive sanitizer for common structural issues.',
    tag: 'Prompt Engineering',
  },
  {
    n: '03',
    problem: 'Multi-model routing without a framework',
    detail: 'Using 4 different models for different task types means keeping track of which model handles which task, managing rate limits per model independently, and deciding when to fall back. LangChain added too much abstraction overhead.',
    solution: 'Built a lightweight LLM client class (shared/llm.ts) that wraps the OpenRouter API with configurable model selection, exponential backoff retry, and a fallback chain. Each workflow function specifies its model directly — no hidden routing magic.',
    tag: 'Architecture',
  },
  {
    n: '04',
    problem: 'Rate limits on free-tier models',
    detail: 'Free-tier models on OpenRouter enforce per-minute and per-day rate limits that vary by model. Running a full batch of 15 postings could exhaust limits mid-pipeline, leaving partially extracted data.',
    solution: 'Added a configurable delay between LLM calls, exponential backoff on 429 responses, and a persistent extraction cache so completed extractions are never re-run. The cache means failed batches restart from the last successful extraction.',
    tag: 'Reliability',
  },
  {
    n: '05',
    problem: 'Zod schema design for open-ended fields',
    detail: "Job postings don't follow a standard — salary fields could be a number, a string, a range, or absent. Skills could be listed as bullet points, inline in paragraphs, or not listed at all. Strict schemas caused constant validation failures on edge-case postings.",
    solution: 'Used Zod transforms and preprocessors to coerce data into target types, moved ambiguous fields to optional with explicit defaults, and wrote separate schemas for extraction vs. storage so the LLM-facing schema is more permissive than the internal data model.',
    tag: 'Schema Design',
  },
  {
    n: '06',
    problem: 'Evaluation without ground-truth labels',
    detail: "There's no labeled dataset of 'correct' job extractions to validate against. Manually checking every JSON output doesn't scale. Without evaluation, it's impossible to know whether a prompt change improved or degraded output quality.",
    solution: "Built an automated eval workflow (eval/index.ts) that uses an LLM-as-judge approach: a separate model scores each extraction on completeness, accuracy, and schema adherence using a rubric. Scores are stored per-run so prompt changes can be compared objectively.",
    tag: 'Evaluation',
  },
];

export default function Challenges() {
  return (
    <section className="mob-section-pad" style={{ padding: '7rem 2rem', maxWidth: 900, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.6 }}
        style={{ marginBottom: '3.5rem' }}
      >
        <div style={{
          fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-2)',
          letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '1rem',
        }}>
          Engineering
        </div>
        <h2 style={{ fontSize: '2.2rem', fontWeight: 700, letterSpacing: '-1.5px', color: 'var(--text-1)' }}>
          Challenges & solutions
        </h2>
        <p style={{
          color: 'var(--text-2)', fontSize: '0.95rem', fontFamily: 'var(--font-body)',
          marginTop: '0.6rem', maxWidth: 580, fontWeight: 400, lineHeight: 1.75,
        }}>
          The interesting problems that came up building a production-grade LLM pipeline from scratch —
          and how each one was solved.
        </p>
      </motion.div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--border)' }}>
        {challenges.map((c, i) => (
          <motion.div key={c.n}
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: i * 0.07, duration: 0.5 }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--elevated)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface)'; }}
            style={{
              background: 'var(--surface)', padding: '2rem',
              transition: 'background 0.3s', cursor: 'default',
            }}
          >
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {/* Stage number */}
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
                color: 'var(--text-3)', fontWeight: 500, flexShrink: 0,
                paddingTop: 3, minWidth: 24,
              }}>
                {c.n}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  display: 'flex', gap: '0.75rem', alignItems: 'center',
                  marginBottom: '0.6rem', flexWrap: 'wrap',
                }}>
                  <h3 style={{
                    fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-1)',
                    letterSpacing: '-0.2px',
                  }}>
                    {c.problem}
                  </h3>
                  <div style={{
                    padding: '0.15rem 0.5rem', background: 'var(--elevated)',
                    border: '1px solid var(--border)', borderRadius: 2,
                    fontSize: '0.62rem', fontFamily: 'var(--font-mono)',
                    color: 'var(--text-3)', letterSpacing: '1px', textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                  }}>
                    {c.tag}
                  </div>
                </div>

                {/* Problem detail */}
                <p style={{
                  color: 'var(--text-2)', fontSize: '0.87rem', lineHeight: 1.75,
                  fontFamily: 'var(--font-body)', fontWeight: 400, marginBottom: '1rem',
                }}>
                  {c.detail}
                </p>

                {/* Solution */}
                <div style={{
                  borderLeft: '2px solid var(--border-glow)', paddingLeft: '1rem',
                }}>
                  <div style={{
                    fontSize: '0.63rem', fontFamily: 'var(--font-mono)', color: 'var(--text-3)',
                    letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '0.4rem',
                  }}>
                    Solution
                  </div>
                  <p style={{
                    color: 'var(--text-2)', fontSize: '0.87rem', lineHeight: 1.75,
                    fontFamily: 'var(--font-body)', fontWeight: 400,
                  }}>
                    {c.solution}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
