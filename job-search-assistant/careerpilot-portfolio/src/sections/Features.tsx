import React from 'react';
import { motion } from 'framer-motion';

const features = [
  { title: 'PDF Extraction', desc: 'Ingest job posting PDFs, extract text, convert to validated JSON with LLM parsing + Zod schemas.' },
  { title: 'Market Analysis', desc: 'Aggregate skills, salary trends, experience levels, remote patterns across all postings.' },
  { title: 'Company Intel', desc: 'Tavily-powered web search — company size, engineering culture, recent news.' },
  { title: 'Fit Scoring', desc: '0–100 fit score with skill match breakdown. Strong Fit, Good Fit, Stretch, Growth Target.' },
  { title: 'Resume Advisor', desc: '4–6 targeted resume changes per job — exact wording, ATS optimization rationale.' },
  { title: 'Cover Letters', desc: 'Strategic guidance + full 250–350 word professional draft tailored to each role.' },
  { title: 'Interview Prep', desc: '5–7 role-specific questions with answer strategies and talking points.' },
  { title: 'Gap Analysis', desc: 'Prioritized gaps: quick wins, short-term, medium-term, long-term with resources.' },
  { title: 'HTML Reports', desc: 'Self-contained visual reports with score gauges, charts, and complete dossiers.' },
];

export default function Features() {
  return (
    <section id="features" style={{ padding: '7rem 2rem', maxWidth: 1200, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.6 }}
        style={{ marginBottom: '4rem' }}
      >
        <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-2)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '1rem' }}>
          Capabilities
        </div>
        <h2 style={{ fontSize: '2.2rem', fontWeight: 700, letterSpacing: '-1.5px', lineHeight: 1.1, color: 'var(--text-1)' }}>
          Everything you need
        </h2>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'var(--border)' }}>
        {features.map((f, i) => (
          <motion.div key={f.title}
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
            viewport={{ once: true }} transition={{ delay: i * 0.04, duration: 0.5 }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--elevated)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface)'; }}
            style={{
              background: 'var(--surface)', padding: '2rem',
              cursor: 'default', transition: 'background 0.3s',
            }}
          >
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.6rem', color: 'var(--text-1)', letterSpacing: '-0.2px' }}>{f.title}</h3>
            <p style={{ color: 'var(--text-2)', fontSize: '0.88rem', lineHeight: 1.75, fontFamily: 'var(--font-body)', fontWeight: 400 }}>{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
