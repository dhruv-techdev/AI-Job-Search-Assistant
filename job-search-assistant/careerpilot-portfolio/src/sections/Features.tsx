import React from 'react';
import { motion } from 'framer-motion';

const features = [
  { title: 'PDF Batch Extraction', desc: 'Drop any number of job posting PDFs into postings/ and run one command. Each PDF is extracted, cleaned, and converted to a validated JSON object with 20+ structured fields — title, skills, salary, remote policy, experience level, and more.' },
  { title: 'Market Intelligence', desc: 'Aggregate skill frequency, salary percentiles, experience level distribution, and remote work trends across every posting. Know what the market actually wants before you apply to anything.' },
  { title: 'Company Research', desc: 'Tavily-powered live web search enriches each posting with company size, engineering team culture, recent funding or news, and tech stack signals — all baked into the final report automatically.' },
  { title: 'Fit Scoring', desc: '0–100 fit score computed against a target role, with every required skill classified as matched, partial, or gap. Score bands: Strong Fit (85+), Good Fit (70–84), Stretch (55–69), Growth Target (<55).' },
  { title: 'Resume Advisor', desc: '4–6 role-specific resume changes with exact replacement wording, target section, and ATS rationale per suggestion. Grounded in the actual job requirements — not generic advice.' },
  { title: 'Cover Letter Generation', desc: 'Full 250–350 word professional cover letter draft + strategic guidance on which angles to emphasize. Tailored to the role, company culture, and your specific skill match profile.' },
  { title: 'Interview Prep', desc: '5–7 questions derived from the actual posting, your identified gaps, and company research. Each question includes an answer strategy and 2–3 talking points specific to that role.' },
  { title: 'Gap Analysis', desc: 'Skill gaps classified by effort: quick wins (1–2 weeks), short-term (1 month), medium-term (2–3 months), long-term (6+ months). Each gap includes a concrete action plan and learning resource.' },
  { title: 'Multi-Format Reports', desc: 'Every run produces JSON (machine-readable), Markdown (readable anywhere), and a self-contained HTML report with score gauges, skill match grids, and the full application dossier.' },
];

export default function Features() {
  return (
    <section id="features" className="mob-section-pad" style={{ padding: '7rem 2rem', maxWidth: 1200, margin: '0 auto' }}>
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

      <div className="mob-grid-3" style={{ gap: '1px', background: 'var(--border)' }}>
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
