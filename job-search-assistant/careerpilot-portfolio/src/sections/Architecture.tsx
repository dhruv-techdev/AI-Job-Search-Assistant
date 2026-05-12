import React from 'react';
import { motion } from 'framer-motion';

const modules = [
  { name: 'PDF Extraction', path: 'shared/pdf.ts' },
  { name: 'Job Extraction', path: 'extract/index.ts' },
  { name: 'Company Research', path: 'extract/company-research.ts' },
  { name: 'Market Analysis', path: 'extract/market-analysis.ts' },
  { name: 'Resume Parser', path: 'analysis/index.ts' },
  { name: 'Gap Analysis', path: 'analysis/gap-analysis.ts' },
  { name: 'Fit Assessment', path: 'advisor/fit-assessment.ts' },
  { name: 'Resume Advisor', path: 'advisor/resume-adaptations.ts' },
  { name: 'Cover Letter', path: 'advisor/cover-letter.ts' },
  { name: 'Interview Prep', path: 'advisor/interview-prep.ts' },
  { name: 'HTML Reports', path: 'advisor/html-report.ts' },
  { name: 'Evaluation', path: 'eval/index.ts' },
];

const tree = `src/
├── index.ts              → CLI entry (Commander.js)
├── extract/
│   ├── index.ts          → PDF scan + batch extraction
│   ├── prompts.ts        → LLM extraction prompts
│   ├── company-research  → Tavily web search
│   ├── market-analysis   → Skill aggregation
│   └── market-report     → Markdown generation
├── analysis/
│   ├── index.ts          → Resume extraction
│   ├── prompts.ts        → Resume parsing prompts
│   └── gap-analysis      → Gap classification + report
├── advisor/
│   ├── index.ts          → Full advisor pipeline
│   ├── fit-assessment    → Scoring + classification
│   ├── resume-adaptations→ Targeted suggestions
│   ├── cover-letter      → Guidance + draft gen
│   ├── interview-prep    → Questions + strategies
│   ├── markdown-report   → MD report builder
│   └── html-report       → Visual HTML builder
├── shared/
│   ├── types.ts          → Zod schemas (all models)
│   ├── llm.ts            → OpenRouter client + retry
│   ├── tools.ts          → File I/O + PDF scanner
│   └── logger.ts         → Chalk-powered logger
└── eval/
    └── index.ts          → Quality evaluation`;

export default function Architecture() {
  return (
    <section id="architecture" className="mob-section-pad" style={{ padding: '7rem 2rem', maxWidth: 1200, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.6 }}
        style={{ marginBottom: '3rem' }}
      >
        <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-2)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '1rem' }}>
          System Design
        </div>
        <h2 style={{ fontSize: '2.2rem', fontWeight: 700, letterSpacing: '-1.5px', color: 'var(--text-1)' }}>
          Modular architecture
        </h2>
      </motion.div>

      <div className="mob-grid-2" style={{ gap: '2rem', alignItems: 'start' }}>
        <div className="mob-grid-2" style={{ gap: '1px', background: 'var(--border)' }}>
          {modules.map((m, i) => (
            <motion.div key={m.name}
              initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
              viewport={{ once: true }} transition={{ delay: i * 0.03, duration: 0.4 }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--elevated)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface)'; }}
              style={{ background: 'var(--surface)', padding: '1.1rem', cursor: 'default', transition: 'background 0.3s' }}
            >
              <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-1)', marginBottom: '0.25rem' }}>{m.name}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>{m.path}</div>
            </motion.div>
          ))}
        </div>

        <motion.pre initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="mob-arch-pre"
          style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            padding: '1.5rem', fontFamily: 'var(--font-mono)',
            fontSize: '0.76rem', lineHeight: 1.9, color: 'var(--text-2)',
            overflow: 'auto', position: 'sticky', top: 100, borderRadius: 2,
          }}
        >{tree}</motion.pre>
      </div>
    </section>
  );
}
