import React from 'react';
import { motion } from 'framer-motion';

const models = [
  {
    name: 'DeepSeek V3',
    role: 'Primary Extraction',
    provider: 'OpenRouter · deepseek/deepseek-chat-v3',
    tasks: [
      'Job posting PDF → validated JSON',
      'Resume text → structured profile',
      'Schema-constrained field extraction',
    ],
    why: 'Best-in-class instruction following for Zod-constrained JSON schemas. Rarely hallucinates field names or types, making it ideal for the extraction pipeline where downstream Zod validation must pass on the first attempt.',
    dot: '#ffffff',
  },
  {
    name: 'Qwen3 32B',
    role: 'Analysis & Reasoning',
    provider: 'OpenRouter · qwen/qwen3-32b',
    tasks: [
      'Market skill aggregation',
      'Gap effort classification',
      'Multi-source reasoning',
    ],
    why: 'Strong chain-of-thought reasoning across multiple inputs. Used wherever CareerPilot must compare, rank, or classify across several data sources — like mapping a candidate profile against 15 job postings simultaneously.',
    dot: '#aaaaaa',
  },
  {
    name: 'Llama 3.3 70B',
    role: 'Creative Writing',
    provider: 'OpenRouter · meta-llama/llama-3.3-70b-instruct',
    tasks: [
      'Cover letter draft generation',
      'Resume rewrite suggestions',
      'Interview answer strategies',
    ],
    why: "Produces natural, persuasive prose that reads like a human wrote it — not a template. Outperforms smaller models on context-aware creative writing, which matters when the cover letter's job is to actually land interviews.",
    dot: '#888888',
  },
  {
    name: 'Mistral 7B',
    role: 'Fast Classification',
    provider: 'OpenRouter · mistralai/mistral-7b-instruct',
    tasks: [
      'Company size tagging',
      'Remote work trend detection',
      'Experience level categorization',
    ],
    why: 'Low latency for binary and categorical classification tasks. Keeps the pipeline fast when the answer is a simple label, without burning inference time (or rate-limit quota) on a larger model for a trivial decision.',
    dot: '#555555',
  },
];

export default function AIModels() {
  return (
    <section className="mob-section-pad" style={{ padding: '7rem 2rem', maxWidth: 1100, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.6 }}
        style={{ marginBottom: '3.5rem' }}
      >
        <div style={{
          fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-2)',
          letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '1rem',
        }}>
          AI Orchestration
        </div>
        <h2 style={{ fontSize: '2.2rem', fontWeight: 700, letterSpacing: '-1.5px', color: 'var(--text-1)' }}>
          Right model, right task
        </h2>
        <p style={{
          color: 'var(--text-2)', fontSize: '0.95rem', fontFamily: 'var(--font-body)',
          marginTop: '0.6rem', maxWidth: 580, fontWeight: 400, lineHeight: 1.75,
        }}>
          Using one model for everything is wasteful and inaccurate. CareerPilot routes each task to
          the model best suited for it — extraction, reasoning, writing, or classification —
          all via OpenRouter on the free tier.
        </p>
      </motion.div>

      <div className="mob-grid-2" style={{ gap: '1px', background: 'var(--border)' }}>
        {models.map((m, i) => (
          <motion.div key={m.name}
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--elevated)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface)'; }}
            style={{ background: 'var(--surface)', padding: '2rem', transition: 'background 0.3s', cursor: 'default' }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <div style={{
                  fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-1)',
                  marginBottom: '0.4rem', letterSpacing: '-0.3px',
                }}>
                  {m.name}
                </div>
                <div style={{
                  display: 'inline-block', padding: '0.18rem 0.55rem',
                  background: 'var(--elevated)', border: '1px solid var(--border)',
                  fontSize: '0.63rem', fontFamily: 'var(--font-mono)', color: 'var(--text-2)',
                  letterSpacing: '1.2px', textTransform: 'uppercase', borderRadius: 2,
                }}>
                  {m.role}
                </div>
              </div>
              <div style={{
                width: 9, height: 9, borderRadius: '50%',
                background: m.dot, marginTop: 4, flexShrink: 0,
              }} />
            </div>

            {/* Provider */}
            <div style={{
              fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-3)',
              marginBottom: '1rem', letterSpacing: '0.2px',
            }}>
              {m.provider}
            </div>

            {/* Task list */}
            <div style={{ marginBottom: '1.25rem' }}>
              {m.tasks.map((t) => (
                <div key={t} style={{
                  fontSize: '0.83rem', color: 'var(--text-2)', fontFamily: 'var(--font-mono)',
                  padding: '0.22rem 0', display: 'flex', gap: '0.55rem', alignItems: 'center',
                }}>
                  <span style={{ color: 'var(--text-3)', fontSize: '0.5rem' }}>▸</span> {t}
                </div>
              ))}
            </div>

            {/* Why this model */}
            <div style={{
              borderTop: '1px solid var(--border)', paddingTop: '1rem',
              fontSize: '0.83rem', color: 'var(--text-2)', fontFamily: 'var(--font-body)',
              lineHeight: 1.7, fontWeight: 400,
            }}>
              {m.why}
            </div>
          </motion.div>
        ))}
      </div>

      {/* OpenRouter callout */}
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ delay: 0.4, duration: 0.5 }}
        style={{
          marginTop: '1px', background: 'var(--surface)', border: '1px solid var(--border)',
          padding: '1.5rem 2rem', display: 'flex', flexWrap: 'wrap',
          gap: '2rem', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{
            fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-2)',
            letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.4rem',
          }}>
            Gateway
          </div>
          <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-1)' }}>
            All 4 models routed through OpenRouter
          </div>
          <div style={{
            fontSize: '0.83rem', color: 'var(--text-2)', fontFamily: 'var(--font-body)',
            marginTop: '0.3rem', fontWeight: 400,
          }}>
            Single API client, unified retry logic, model fallback on rate-limit — zero infrastructure overhead.
          </div>
        </div>
        <div style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap' }}>
          {[['4', 'Models'], ['1', 'API Client'], ['$0', 'API Cost']].map(([n, l]) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-1)', lineHeight: 1 }}>{n}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '1.5px', fontFamily: 'var(--font-mono)', marginTop: '0.3rem' }}>{l}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
