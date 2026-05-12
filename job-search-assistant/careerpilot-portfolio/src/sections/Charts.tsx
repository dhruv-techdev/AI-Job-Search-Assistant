import React from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  AreaChart, Area,
} from 'recharts';

const skillData = [
  { skill: 'JavaScript', pct: 78 },
  { skill: 'TypeScript', pct: 67 },
  { skill: 'React', pct: 56 },
  { skill: 'Node.js', pct: 44 },
  { skill: 'SQL', pct: 39 },
  { skill: 'Python', pct: 33 },
  { skill: 'Docker', pct: 28 },
  { skill: 'AWS', pct: 22 },
];

const remoteData = [
  { name: 'Remote', value: 35, color: '#ffffff' },
  { name: 'Hybrid', value: 40, color: '#888888' },
  { name: 'Onsite', value: 15, color: '#444444' },
  { name: 'Unlisted', value: 10, color: '#222222' },
];

const radarData = [
  { subject: 'Frontend', candidate: 85, market: 70 },
  { subject: 'Backend', candidate: 60, market: 75 },
  { subject: 'DevOps', candidate: 35, market: 50 },
  { subject: 'Testing', candidate: 70, market: 55 },
  { subject: 'Design', candidate: 45, market: 30 },
  { subject: 'Data', candidate: 40, market: 45 },
];

const salaryData = [
  { range: '60-70k', count: 1 },
  { range: '70-80k', count: 3 },
  { range: '80-90k', count: 4 },
  { range: '90-100k', count: 3 },
  { range: '100-120k', count: 2 },
  { range: '120-140k', count: 1 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#141414', border: '1px solid #282828',
      padding: '0.5rem 0.75rem', borderRadius: 2,
      fontFamily: 'var(--font-mono)', fontSize: '0.75rem',
    }}>
      <div style={{ color: '#ffffff', fontWeight: 500, marginBottom: '0.25rem' }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: '#888888' }}>{p.name}: {p.value}{typeof p.value === 'number' && p.value <= 100 && p.name !== 'count' ? '%' : ''}</div>
      ))}
    </div>
  );
};

const cardStyle = {
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 2, padding: '1.75rem',
};

export default function Charts() {
  return (
    <section id="analytics" className="mob-section-pad" style={{ padding: '7rem 2rem', maxWidth: 1200, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.6 }}
        style={{ marginBottom: '3.5rem' }}
      >
        <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-2)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '1rem' }}>
          Sample Analytics
        </div>
        <h2 style={{ fontSize: '2.2rem', fontWeight: 700, letterSpacing: '-1.5px', color: 'var(--text-1)' }}>
          Data-driven insights
        </h2>
        <p style={{ color: 'var(--text-2)', fontSize: '0.95rem', fontFamily: 'var(--font-body)', marginTop: '0.6rem', fontWeight: 400 }}>
          Real market intelligence generated from analyzed job postings.
        </p>
      </motion.div>

      <div className="mob-grid-2" style={{ gap: '1.5rem' }}>
        {/* Skills Bar Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5 }}
          style={cardStyle}
        >
          <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-2)', letterSpacing: '2px', marginBottom: '0.25rem', textTransform: 'uppercase' }}>
            Top Required Skills
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-2)', fontFamily: 'var(--font-mono)', marginBottom: '1.25rem' }}>
            % of postings requiring each skill
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={skillData} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#555555', fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="skill" tick={{ fontSize: 11, fill: '#666666', fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} width={80} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="pct" name="Demand" radius={[0, 2, 2, 0]} maxBarSize={18}>
                {skillData.map((_, i) => (
                  <Cell key={i} fill={i < 3 ? '#ffffff' : i < 5 ? '#888888' : '#444444'} fillOpacity={0.9} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Remote Work Pie */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ delay: 0.1, duration: 0.5 }}
          style={cardStyle}
        >
          <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-2)', letterSpacing: '2px', marginBottom: '0.25rem', textTransform: 'uppercase' }}>
            Remote Work Trends
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-2)', fontFamily: 'var(--font-mono)', marginBottom: '1.25rem' }}>
            Work arrangement distribution
          </div>
          <div className="mob-pie-row">
            <ResponsiveContainer className="mob-pie-chart" width="55%" height={250}>
              <PieChart>
                <Pie data={remoteData} dataKey="value" cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                  stroke="#000000" strokeWidth={3} paddingAngle={2}
                >
                  {remoteData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {remoteData.map((d) => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{ width: 8, height: 8, borderRadius: 1, background: d.color }} />
                  <span style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)', color: '#666666' }}>
                    {d.name} <span style={{ color: '#aaaaaa', fontWeight: 500 }}>{d.value}%</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Radar Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ delay: 0.15, duration: 0.5 }}
          style={cardStyle}
        >
          <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-2)', letterSpacing: '2px', marginBottom: '0.25rem', textTransform: 'uppercase' }}>
            Candidate vs Market
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-2)', fontFamily: 'var(--font-mono)', marginBottom: '1.25rem' }}>
            Skill domain comparison
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#1e1e1e" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#666666', fontFamily: 'DM Mono' }} />
              <PolarRadiusAxis tick={false} axisLine={false} />
              <Radar name="Candidate" dataKey="candidate" stroke="#ffffff" fill="#ffffff" fillOpacity={0.1} strokeWidth={1.5} />
              <Radar name="Market Demand" dataKey="market" stroke="#555555" fill="#555555" fillOpacity={0.05} strokeWidth={1.5} strokeDasharray="4 4" />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{ width: 16, height: 1.5, background: '#ffffff', borderRadius: 1 }} />
              <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#666666' }}>You</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{ width: 16, height: 1.5, background: '#555555', borderRadius: 1 }} />
              <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#666666' }}>Market</span>
            </div>
          </div>
        </motion.div>

        {/* Salary Distribution */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ delay: 0.2, duration: 0.5 }}
          style={cardStyle}
        >
          <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-2)', letterSpacing: '2px', marginBottom: '0.25rem', textTransform: 'uppercase' }}>
            Salary Distribution
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-2)', fontFamily: 'var(--font-mono)', marginBottom: '1.25rem' }}>
            CAD annual salary ranges
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={salaryData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="salaryGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ffffff" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
              <XAxis dataKey="range" tick={{ fontSize: 10, fill: '#555555', fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#555555', fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="count" name="Postings" stroke="#ffffff" fill="url(#salaryGrad)" strokeWidth={1.5} dot={{ r: 3, fill: '#ffffff', stroke: '#000000', strokeWidth: 1.5 }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </section>
  );
}
