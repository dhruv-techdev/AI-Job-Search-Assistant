import React from 'react';
import { motion } from 'framer-motion';

const techs = [
  { name: 'TypeScript', cat: 'Language' },
  { name: 'Node.js', cat: 'Runtime' },
  { name: 'Commander.js', cat: 'CLI' },
  { name: 'Zod', cat: 'Validation' },
  { name: 'OpenRouter', cat: 'LLM Gateway' },
  { name: 'DeepSeek V3', cat: 'Primary AI' },
  { name: 'Qwen3 32B', cat: 'Fallback AI' },
  { name: 'Llama 3.3 70B', cat: 'Creative AI' },
  { name: 'Mistral 7B', cat: 'Fast AI' },
  { name: 'Tavily', cat: 'Web Search' },
  { name: 'pdf-parse', cat: 'PDF Reader' },
  { name: 'Chalk + Ora', cat: 'CLI UX' },
];

export default function TechStack() {
  return (
    <section id="tech" style={{ padding: '7rem 2rem', maxWidth: 1000, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.6 }}
        style={{ marginBottom: '3rem' }}
      >
        <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-2)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '1rem' }}>
          Technology
        </div>
        <h2 style={{ fontSize: '2.2rem', fontWeight: 700, letterSpacing: '-1.5px', color: 'var(--text-1)' }}>
          Built with modern tools
        </h2>
        <p style={{ color: 'var(--text-2)', fontFamily: 'var(--font-body)', marginTop: '0.6rem', fontSize: '0.95rem', fontWeight: 400 }}>
          Free AI models. Zero cost. Production-grade output.
        </p>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1px', background: 'var(--border)' }}>
        {techs.map((t, i) => (
          <motion.div key={t.name}
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
            viewport={{ once: true }} transition={{ delay: i * 0.03, duration: 0.4 }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--elevated)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface)'; }}
            style={{
              background: 'var(--surface)', padding: '1.25rem 1.5rem',
              cursor: 'default', transition: 'background 0.3s',
            }}
          >
            <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-1)' }}>{t.name}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-2)', fontFamily: 'var(--font-mono)', marginTop: '0.2rem', letterSpacing: '0.3px' }}>{t.cat}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
