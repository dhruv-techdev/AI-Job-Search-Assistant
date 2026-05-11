import React from 'react';

export default function Footer() {
  return (
    <footer style={{
      padding: '3rem 2rem', textAlign: 'center',
      borderTop: '1px solid var(--border)', background: 'var(--abyss)',
    }}>
      <div style={{ marginBottom: '1rem' }}>
        <span style={{ fontWeight: 600, fontSize: '0.95rem', letterSpacing: '-0.3px', color: 'var(--text-1)', fontFamily: 'var(--font-display)' }}>
          CareerPilot
        </span>
      </div>
      <p style={{ color: 'var(--text-2)', fontSize: '0.82rem', fontFamily: 'var(--font-body)', maxWidth: 400, margin: '0 auto 1.5rem', fontWeight: 400 }}>
        AI-Powered Job Search & Application Intelligence Platform
      </p>
      <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {['TypeScript', 'Node.js', 'OpenRouter', 'Zod', 'Tavily'].map((t) => (
          <span key={t} style={{ color: 'var(--text-2)', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.5px' }}>{t}</span>
        ))}
      </div>
      <p style={{ color: 'var(--text-3)', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
        Portfolio Project · © {new Date().getFullYear()}
      </p>
    </footer>
  );
}
