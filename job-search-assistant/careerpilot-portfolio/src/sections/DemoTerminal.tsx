import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const commands = [
  { tab: 'market', prompt: '$ npm run market --force', output: [
    '[INFO] === Market Analysis Workflow ===',
    '[INFO] Found 9 PDF file(s) in postings/',
    '✔ [1/9] QA Automation Engineer at Cognizant',
    '✔ [2/9] Backend Engineer at Spotify',
    '✔ [3/9] Full Stack Developer (Front End) at CGI',
    '✔ [4/9] .NET Full Stack Developer at Trisura',
    '✔ [5/9] XR Software Developer at Mercor',
    '✔ [6/9] Software Tester at Seequent',
    '✔ [7/9] Intern QA at Lumeto',
    '✔ [8/9] Security Specialist at TD',
    '✔ [9/9] Info Sec AI Pen Tester at TD',
    '',
    '[SUCCESS] Extracted: 9 | Failed: 0',
    '[INFO] Top skills: JavaScript (78%) TypeScript (67%) React (56%)',
    '[SUCCESS] Saved → data/analysis/market-analysis.json',
    '[SUCCESS] Saved → reports/market-analysis.md',
  ]},
  { tab: 'gaps', prompt: '$ npm run gaps postings/my-resume.pdf', output: [
    '[INFO] === Gap Analysis Workflow ===',
    '✔ Resume extracted and validated!',
    '',
    '[INFO] Name: John Developer',
    '[INFO] Hard Skills (14): JavaScript, TypeScript, React, Node.js...',
    '[INFO] Work Experience: 3 positions',
    '[INFO] Projects: 5 projects',
    '',
    '[INFO] Skills matched: 9 | Missing: 5',
    '[INFO] Experience: mid-level (market wants: mid)',
    '✔ Gap analysis complete!',
    '',
    '[INFO] Readiness: 72/100',
    '[INFO]  Quick wins: Docker, CI/CD',
    '[INFO]  Short-term: AWS, System Design',
    '[SUCCESS] Saved → reports/gap-analysis.md',
  ]},
  { tab: 'advise', prompt: '$ npm run advise postings/spotify-backend.pdf', output: [
    '[INFO] === Application Advisor ===',
    '✔ Target: Backend Engineer at Spotify',
    '✔ Fit Score: 74/100 — Good Fit',
    '',
    '[INFO]  Match (6): JavaScript, Node.js, REST, Git, SQL, TypeScript',
    '[INFO]  Partial (2): System Design, Microservices',
    '[INFO]  Gap (2): Kafka, gRPC',
    '',
    '✔ 5 resume suggestions generated',
    '✔ Cover letter draft saved',
    '✔ 6 interview questions generated',
    '',
    '[SUCCESS] === Complete! ===',
    '[INFO] HTML  → reports/application-spotify.html',
    '[INFO] Open  → open reports/application-spotify.html',
  ]},
];

function lineColor(line: string) {
  if (line.includes('[SUCCESS]') || line.startsWith('✔')) return '#ffffff';
  if (line.includes('[INFO]')) return '#666666';
  if (line === '') return 'transparent';
  return '#888888';
}

export default function DemoTerminal() {
  const [active, setActive] = useState(0);
  const [lines, setLines] = useState(0);
  const output = commands[active].output;

  useEffect(() => {
    setLines(0);
    const iv = setInterval(() => {
      setLines((v) => { if (v >= output.length) { clearInterval(iv); return v; } return v + 1; });
    }, 80);
    return () => clearInterval(iv);
  }, [active, output.length]);

  return (
    <section id="demo" className="mob-section-pad" style={{ padding: '5rem 2rem', maxWidth: 880, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.6 }}
        style={{ marginBottom: '2rem' }}
      >
        <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-2)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '1rem' }}>
          Live Demo
        </div>
        <h2 style={{ fontSize: '2.2rem', fontWeight: 700, letterSpacing: '-1.5px', color: 'var(--text-1)' }}>
          Three commands. Full intelligence.
        </h2>
      </motion.div>

      <div style={{ display: 'flex', gap: 0, marginBottom: 0 }}>
        {commands.map((c, i) => (
          <button key={i} onClick={() => setActive(i)} style={{
            padding: '0.6rem 1.5rem',
            border: '1px solid var(--border)',
            borderBottom: active === i ? '1px solid var(--surface)' : '1px solid var(--border)',
            background: active === i ? 'var(--surface)' : 'var(--abyss)',
            color: active === i ? 'var(--text-1)' : 'var(--text-2)',
            fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 400,
            cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '0.3px',
            borderTop: active === i ? '1px solid var(--border-glow)' : '1px solid var(--border)',
            borderRadius: 0,
          }}>
            {c.tab}
          </button>
        ))}
      </div>

      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)', borderTop: 'none',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '10px 14px', background: 'var(--abyss)', borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--border-glow)' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--border-glow)' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--border-glow)' }} />
          <span style={{ marginLeft: 12, color: 'var(--text-2)', fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}>
            ~/job-search-assistant
          </span>
        </div>

        <div className="mob-terminal-scroll" style={{ padding: '1.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', lineHeight: 1.9, minHeight: 380, overflowX: 'auto' }}>
          <div style={{ color: 'var(--text-1)', fontWeight: 500, marginBottom: '0.25rem' }}>{commands[active].prompt}</div>
          {output.slice(0, lines).map((line, i) => (
            <div key={i} style={{ color: lineColor(line) }}>
              {line}
            </div>
          ))}
          {lines < output.length && (
            <span style={{ color: 'var(--text-2)', animation: 'blink 0.8s infinite' }}>▌</span>
          )}
        </div>
      </div>

      <style>{`@keyframes blink { 0%,100% { opacity:1 } 50% { opacity:0 } }`}</style>
    </section>
  );
}
