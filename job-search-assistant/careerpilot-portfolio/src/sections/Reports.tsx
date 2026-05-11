import React from 'react';
import { motion } from 'framer-motion';

const reports = [
  { title: 'Market Analysis', format: 'JSON + MD',
    items: ['Skill frequency rankings', 'Salary range overview', 'Remote work distribution', 'Experience levels', 'Education trends'] },
  { title: 'Gap Analysis', format: 'JSON + MD',
    items: ['Readiness score 0–100', 'Strengths with evidence', 'Classified gaps', 'Action plans', 'Learning resources'] },
  { title: 'Application Report', format: 'JSON + MD + HTML',
    items: ['Fit score gauge', 'Skill match grid', 'Resume suggestions', 'Cover letter draft', 'Interview prep'] },
];

export default function Reports() {
  return (
    <section style={{ padding: '7rem 2rem', maxWidth: 1100, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.6 }}
        style={{ marginBottom: '3rem' }}
      >
        <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-2)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '1rem' }}>
          Outputs
        </div>
        <h2 style={{ fontSize: '2.2rem', fontWeight: 700, letterSpacing: '-1.5px', color: 'var(--text-1)' }}>
          Professional reports
        </h2>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'var(--border)' }}>
        {reports.map((r, i) => (
          <motion.div key={r.title}
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }}
            style={{ background: 'var(--surface)', padding: '2rem', transition: 'background 0.3s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--elevated)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface)'; }}
          >
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-1)' }}>{r.title}</h3>
            <div style={{
              display: 'inline-block', padding: '0.2rem 0.6rem', marginBottom: '1.25rem',
              background: 'var(--elevated)', border: '1px solid var(--border)',
              fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-2)', letterSpacing: '0.3px',
              borderRadius: 2,
            }}>{r.format}</div>
            <div>
              {r.items.map((item) => (
                <div key={item} style={{
                  color: 'var(--text-2)', fontSize: '0.88rem', padding: '0.3rem 0',
                  fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: '0.6rem',
                  fontWeight: 400,
                }}>
                  <span style={{ color: 'var(--text-3)', fontSize: '0.55rem' }}>—</span> {item}
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
