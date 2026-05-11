import React from 'react';
import { motion } from 'framer-motion';

const stages = [
  { n: '01', t: 'Ingest PDFs', d: 'Scan postings/ for job PDFs, extract readable text via pdf-parse.' },
  { n: '02', t: 'LLM Extraction', d: 'DeepSeek V3 converts raw text → structured JSON. Zod validates every field.' },
  { n: '03', t: 'Company Intel', d: 'Tavily web search enriches data — company size, culture, recent news.' },
  { n: '04', t: 'Market Analysis', d: 'Aggregate skill frequency, salary ranges, experience levels, remote trends.' },
  { n: '05', t: 'Resume Parsing', d: 'Extract candidate skills, experience, projects, education, certifications.' },
  { n: '06', t: 'Gap Analysis', d: 'Compare resume vs market. Classify gaps by effort with action plans.' },
  { n: '07', t: 'Fit Scoring', d: '0–100 score against target job. Skill-by-skill match/partial/gap breakdown.' },
  { n: '08', t: 'Report Generation', d: 'Resume suggestions, cover letter, interview prep → JSON + MD + HTML.' },
];

export default function Workflow() {
  return (
    <section id="workflow" style={{ padding: '7rem 2rem', maxWidth: 860, margin: '0 auto' }}>
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
