import React from 'react';
import { motion } from 'framer-motion';

const problems = [
  {
    t: 'Hours of manual reading',
    d: 'Scanning 15+ job postings to understand the market takes 4–6 hours of reading with nothing structured to show for it.',
  },
  {
    t: 'No objective fit score',
    d: "You either under-apply (\"I don't have every requirement\") or over-apply blindly. There's no data-driven way to know where you stand.",
  },
  {
    t: 'Generic, one-size-fits-all applications',
    d: 'Cover letters and resume tweaks are written from scratch every time, with no grounding in what the specific role actually values.',
  },
  {
    t: 'Scattered interview preparation',
    d: 'Interview prep comes from generic guides, not from the actual posting, the company culture, or your specific skill gaps.',
  },
];

const solutions = [
  {
    t: 'Market intelligence in minutes',
    d: 'One command batch-processes every PDF in your postings folder — skill frequency, salary ranges, remote trends, all in structured JSON.',
  },
  {
    t: 'Skill-by-skill fit breakdown',
    d: 'Get a 0–100 fit score with every skill classified as matched, partial, or gap — so you prioritize applications with real data.',
  },
  {
    t: 'Role-specific application strategy',
    d: 'Resume suggestions with exact wording per section, a full 250–350 word cover letter draft, and ATS optimization rationale — all tailored to the posting.',
  },
  {
    t: 'Targeted, evidence-based prep',
    d: '5–7 interview questions drawn from the actual job requirements, your skill gaps, and Tavily-sourced company intelligence.',
  },
];

export default function Problem() {
  return (
    <section className="mob-section-pad" style={{ padding: '7rem 2rem', maxWidth: 1100, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.6 }}
        style={{ marginBottom: '3.5rem' }}
      >
        <div style={{
          fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-2)',
          letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '1rem',
        }}>
          Motivation
        </div>
        <h2 style={{ fontSize: '2.2rem', fontWeight: 700, letterSpacing: '-1.5px', color: 'var(--text-1)' }}>
          Why this exists
        </h2>
        <p style={{
          color: 'var(--text-2)', fontSize: '0.95rem', fontFamily: 'var(--font-body)',
          marginTop: '0.6rem', maxWidth: 620, fontWeight: 400, lineHeight: 1.75,
        }}>
          Job searching is an intelligence problem. Most candidates apply blindly — no market data,
          no objective fit analysis, no structured strategy. CareerPilot turns unstructured PDFs
          into a full intelligence briefing.
        </p>
      </motion.div>

      <div className="mob-grid-2" style={{ gap: '2.5rem' }}>
        {/* Problems */}
        <div>
          <div style={{
            fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-3)',
            letterSpacing: '2px', textTransform: 'uppercase',
            marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)',
          }}>
            Without CareerPilot
          </div>
          {problems.map((p, i) => (
            <motion.div key={p.t}
              initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.5 }}
              style={{
                marginBottom: '1.75rem', paddingLeft: '1.1rem',
                borderLeft: '2px solid var(--border)',
              }}
            >
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-1)', marginBottom: '0.35rem' }}>
                {p.t}
              </div>
              <div style={{
                fontSize: '0.85rem', color: 'var(--text-2)', fontFamily: 'var(--font-body)',
                lineHeight: 1.75, fontWeight: 400,
              }}>
                {p.d}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Solutions */}
        <div>
          <div style={{
            fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-2)',
            letterSpacing: '2px', textTransform: 'uppercase',
            marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-glow)',
          }}>
            With CareerPilot
          </div>
          {solutions.map((s, i) => (
            <motion.div key={s.t}
              initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.5 }}
              style={{
                marginBottom: '1.75rem', paddingLeft: '1.1rem',
                borderLeft: '2px solid var(--border-glow)',
              }}
            >
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-1)', marginBottom: '0.35rem' }}>
                {s.t}
              </div>
              <div style={{
                fontSize: '0.85rem', color: 'var(--text-2)', fontFamily: 'var(--font-body)',
                lineHeight: 1.75, fontWeight: 400,
              }}>
                {s.d}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
