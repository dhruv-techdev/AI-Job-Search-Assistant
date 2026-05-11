import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const links = [
  { label: 'Features', href: '#features' },
  { label: 'Demo', href: '#demo' },
  { label: 'Analytics', href: '#analytics' },
  { label: 'Architecture', href: '#architecture' },
  { label: 'Stack', href: '#tech' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        padding: '1rem 2.5rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: scrolled ? 'rgba(0,0,0,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
        transition: 'all 0.4s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{
          fontFamily: 'var(--font-display)', fontWeight: 700,
          fontSize: '1rem', letterSpacing: '-0.5px', color: 'var(--text-1)',
        }}>
          CareerPilot
        </span>
      </div>

      <div style={{ display: 'flex', gap: '2.5rem' }}>
        {links.map((l) => (
          <a key={l.label} href={l.href} style={{
            color: 'var(--text-2)', textDecoration: 'none',
            fontSize: '0.8rem', fontWeight: 400,
            letterSpacing: '0.3px',
            fontFamily: 'var(--font-body)', transition: 'color 0.2s',
          }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-2)'; }}
          >
            {l.label}
          </a>
        ))}
      </div>
    </motion.nav>
  );
}
