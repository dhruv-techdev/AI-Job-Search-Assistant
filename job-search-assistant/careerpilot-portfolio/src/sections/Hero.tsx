import React from 'react';
import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.15, duration: 0.8, ease: 'easeOut' as const },
  }),
};

export default function Hero() {
  return (
    <section style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center', textAlign: 'center',
      position: 'relative', padding: '7rem 2rem 5rem', overflow: 'hidden',
    }}>
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 900 }}>
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.4rem 1.2rem', border: '1px solid var(--border-glow)',
            borderRadius: 2, fontSize: '0.7rem', fontWeight: 500,
            letterSpacing: '2px', textTransform: 'uppercase',
            color: 'var(--text-2)', fontFamily: 'var(--font-mono)',
            marginBottom: '2.5rem',
          }}
        >
          <span style={{ width: 5, height: 5, background: 'var(--text-2)', borderRadius: '50%' }} />
          AI Career Intelligence Engine
        </motion.div>

        <motion.h1 variants={fadeUp} initial="hidden" animate="visible" custom={1}
          style={{
            fontSize: 'clamp(2.8rem, 7.5vw, 6rem)', fontWeight: 700,
            letterSpacing: '-3px', lineHeight: 1, marginBottom: '2rem',
            fontFamily: 'var(--font-display)',
          }}
        >
          <span style={{ display: 'block', color: 'var(--text-2)' }}>Stop Guessing.</span>
          <span style={{ display: 'block', color: 'var(--text-1)' }}>Start Targeting.</span>
        </motion.h1>

        <motion.p variants={fadeUp} initial="hidden" animate="visible" custom={2}
          style={{
            fontSize: '1.05rem', color: 'var(--text-2)', maxWidth: 520,
            margin: '0 auto 3rem', fontFamily: 'var(--font-body)',
            fontWeight: 400, lineHeight: 1.8,
          }}
        >
          Transform job postings and resumes into structured intelligence —
          fit scores, gap analysis, tailored cover letters, and interview prep. All from your terminal.
        </motion.p>

        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3}
          style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}
        >
          <a href="#demo" style={{
            padding: '0.85rem 2.25rem', borderRadius: 2,
            background: 'var(--text-1)', color: 'var(--void)',
            fontFamily: 'var(--font-body)', fontSize: '0.9rem',
            fontWeight: 600, textDecoration: 'none',
            transition: 'opacity 0.2s',
          }}>
            See Demo
          </a>
          <a href="https://github.com" target="_blank" rel="noreferrer" style={{
            padding: '0.85rem 2.25rem', borderRadius: 2,
            background: 'transparent', color: 'var(--text-2)',
            border: '1px solid var(--border-glow)',
            fontFamily: 'var(--font-body)', fontSize: '0.9rem',
            fontWeight: 500, textDecoration: 'none',
            transition: 'color 0.2s, border-color 0.2s',
          }}>
            GitHub
          </a>
        </motion.div>

        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={4}
          style={{
            display: 'flex', gap: '4rem', justifyContent: 'center',
            marginTop: '5rem', flexWrap: 'wrap',
            borderTop: '1px solid var(--border)', paddingTop: '3rem',
          }}
        >
          {[
            ['15+', 'Job Postings'],
            ['99', 'Requirements'],
            ['4', 'AI Models'],
            ['$0', 'API Cost'],
          ].map(([num, label]) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '2.2rem', fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-1)', lineHeight: 1,
              }}>{num}</div>
              <div style={{
                fontSize: '0.7rem', color: 'var(--text-2)',
                textTransform: 'uppercase', letterSpacing: '1.5px',
                fontFamily: 'var(--font-mono)', marginTop: '0.5rem',
              }}>{label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
