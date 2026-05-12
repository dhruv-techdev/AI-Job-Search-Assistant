import React, { useState } from 'react';
import { motion } from 'framer-motion';

const tabs = [
  {
    label: 'fit-report',
    title: 'Application Fit Report',
    desc: 'Output of npm run advise — per-skill breakdown with score and classification.',
    code: `{
  "jobTitle": "Backend Engineer",
  "company": "Spotify",
  "fitScore": 74,
  "classification": "Good Fit",
  "summary": "Strong match on core backend stack. Gaps in
   distributed systems tooling (Kafka, gRPC) are learnable
   but will be noticed in a system design round.",

  "skillBreakdown": {
    "matched":  ["JavaScript", "Node.js", "REST APIs",
                 "Git", "SQL", "TypeScript"],
    "partial":  ["System Design", "Microservices"],
    "gaps":     ["Apache Kafka", "gRPC", "Kubernetes"]
  },

  "resumeSuggestions": [
    {
      "section": "Experience — Backend Role",
      "change": "Replace 'built REST endpoints' with
        'designed and shipped REST microservices handling
        12k req/min with <50ms p99 latency'",
      "rationale": "Spotify's rubric favors scale metrics
        over generic capability statements."
    },
    {
      "section": "Projects",
      "change": "Add event-driven architecture note to
        your messaging project; mention pub/sub pattern.",
      "rationale": "Signals Kafka-adjacent thinking even
        without direct experience."
    }
  ]
}`,
  },
  {
    label: 'gap-analysis',
    title: 'Gap Analysis Report',
    desc: 'Output of npm run gaps — readiness score with prioritized action plan.',
    code: `{
  "candidateName": "John Developer",
  "readinessScore": 72,
  "marketAlignment": "mid-level",

  "strengths": [
    "Strong frontend stack (React, TypeScript, CSS)",
    "3 shipped projects with measurable outcomes",
    "Testing fundamentals — Jest, Playwright"
  ],

  "gaps": {
    "quickWins": [
      {
        "skill": "Docker",
        "effort": "1–2 weeks",
        "action": "Containerize an existing project.
          Add docker-compose for local dev.",
        "resource": "Docker Getting Started + Play with Docker"
      }
    ],
    "shortTerm": [
      {
        "skill": "CI/CD",
        "effort": "2–4 weeks",
        "action": "Set up GitHub Actions pipeline with
          lint, test, and deploy steps.",
        "resource": "GitHub Actions docs + ACT for local testing"
      }
    ],
    "mediumTerm": [
      {
        "skill": "AWS (EC2, S3, Lambda)",
        "effort": "1–2 months",
        "action": "Deploy a Node.js app end-to-end on AWS.
          Use free tier. Get AWS CCP cert.",
        "resource": "AWS Skill Builder + Adrian Cantrill course"
      }
    ]
  }
}`,
  },
  {
    label: 'market-intel',
    title: 'Market Intelligence',
    desc: 'Output of npm run market — aggregated across all postings in the postings/ folder.',
    code: `{
  "analysisDate": "2025-01-14",
  "postingsAnalyzed": 15,
  "requirementsExtracted": 99,

  "topSkills": [
    { "skill": "JavaScript", "frequency": 78, "trend": "stable" },
    { "skill": "TypeScript",  "frequency": 67, "trend": "rising" },
    { "skill": "React",       "frequency": 56, "trend": "stable" },
    { "skill": "Node.js",     "frequency": 44, "trend": "stable" },
    { "skill": "Docker",      "frequency": 39, "trend": "rising" },
    { "skill": "AWS",         "frequency": 33, "trend": "rising" }
  ],

  "experienceLevels": {
    "junior":   "13%",
    "mid":      "54%",
    "senior":   "27%",
    "staff":     "6%"
  },

  "salaryRanges": {
    "median": "$88,000 CAD",
    "p25":    "$72,000 CAD",
    "p75":   "$108,000 CAD"
  },

  "remoteWork": {
    "remote":   "35%",
    "hybrid":   "40%",
    "onsite":   "15%",
    "unlisted": "10%"
  },

  "companySizes": {
    "startup":    "20%",
    "scaleup":    "33%",
    "enterprise": "47%"
  }
}`,
  },
];

function lineColor(line: string): string {
  if (line.trim().startsWith('"') && line.includes(':')) {
    const key = line.split(':')[0].trim().replace(/"/g, '');
    if (['fitScore', 'readinessScore', 'postingsAnalyzed', 'requirementsExtracted', 'median'].includes(key))
      return '#ffffff';
    return '#888888';
  }
  if (line.trim().startsWith('"') && !line.includes(':')) return '#aaaaaa';
  if (['{', '}', '[', ']'].some(c => line.trim() === c)) return '#444444';
  return '#666666';
}

export default function SampleOutput() {
  const [active, setActive] = useState(0);
  const tab = tabs[active];

  return (
    <section className="mob-section-pad" style={{ padding: '7rem 2rem', maxWidth: 900, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.6 }}
        style={{ marginBottom: '2.5rem' }}
      >
        <div style={{
          fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-2)',
          letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '1rem',
        }}>
          Real Output
        </div>
        <h2 style={{ fontSize: '2.2rem', fontWeight: 700, letterSpacing: '-1.5px', color: 'var(--text-1)' }}>
          What the tool actually produces
        </h2>
        <p style={{
          color: 'var(--text-2)', fontSize: '0.95rem', fontFamily: 'var(--font-body)',
          marginTop: '0.6rem', fontWeight: 400, lineHeight: 1.75,
        }}>
          Every field is Zod-validated before being written to disk.
          All JSON shown here is representative of real pipeline output.
        </p>
      </motion.div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 0, flexWrap: 'wrap' }}>
        {tabs.map((t, i) => (
          <button key={i} onClick={() => setActive(i)} style={{
            padding: '0.6rem 1.4rem',
            border: '1px solid var(--border)',
            borderBottom: active === i ? '1px solid var(--surface)' : '1px solid var(--border)',
            background: active === i ? 'var(--surface)' : 'var(--abyss)',
            color: active === i ? 'var(--text-1)' : 'var(--text-2)',
            fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 400,
            cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '0.3px',
            borderTop: active === i ? '1px solid var(--border-glow)' : '1px solid var(--border)',
            borderRadius: 0,
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Code block */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)', borderTop: 'none',
      }}>
        {/* Window chrome */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px', background: 'var(--abyss)', borderBottom: '1px solid var(--border)',
          flexWrap: 'wrap', gap: '0.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--border-glow)' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--border-glow)' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--border-glow)' }} />
            <span style={{
              marginLeft: 10, color: 'var(--text-2)',
              fontSize: '0.7rem', fontFamily: 'var(--font-mono)',
            }}>
              reports/{tab.label}.json
            </span>
          </div>
          <span style={{
            fontSize: '0.68rem', color: 'var(--text-3)',
            fontFamily: 'var(--font-body)', fontStyle: 'italic',
          }}>
            {tab.desc}
          </span>
        </div>

        {/* JSON output */}
        <div style={{ overflowX: 'auto' }}>
          <pre style={{
            padding: '1.5rem',
            fontFamily: 'var(--font-mono)', fontSize: '0.78rem',
            lineHeight: 1.85, margin: 0, minWidth: 0,
            whiteSpace: 'pre',
          }}>
            {tab.code.split('\n').map((line, i) => (
              <div key={i} style={{ color: lineColor(line) }}>{line}</div>
            ))}
          </pre>
        </div>
      </div>

      {/* Zod validation note */}
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
        viewport={{ once: true }} transition={{ delay: 0.3, duration: 0.5 }}
        style={{
          marginTop: '1.5rem', padding: '1rem 1.5rem',
          background: 'var(--surface)', border: '1px solid var(--border)',
          display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap',
        }}
      >
        <div style={{
          fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-3)',
          letterSpacing: '2px', textTransform: 'uppercase', paddingTop: 2, whiteSpace: 'nowrap',
        }}>
          Validation
        </div>
        <div style={{ fontSize: '0.83rem', color: 'var(--text-2)', fontFamily: 'var(--font-body)', lineHeight: 1.7, fontWeight: 400 }}>
          Every LLM response is parsed through a Zod schema before being used. If validation fails,
          the pipeline retries with an error-correction prompt that includes the Zod error message —
          typically resolving on the second attempt without human intervention.
        </div>
      </motion.div>
    </section>
  );
}
