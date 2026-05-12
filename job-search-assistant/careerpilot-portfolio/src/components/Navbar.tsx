import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const links = [
  { label: 'Features', href: '#features' },
  { label: 'Demo', href: '#demo' },
  { label: 'Analytics', href: '#analytics' },
  { label: 'Architecture', href: '#architecture' },
  { label: 'Stack', href: '#tech' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  useEffect(() => {
    if (!isMobile) setMenuOpen(false);
  }, [isMobile]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
          padding: '1rem 2rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: scrolled || menuOpen ? 'rgba(0,0,0,0.92)' : 'transparent',
          backdropFilter: scrolled || menuOpen ? 'blur(20px)' : 'none',
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

        {/* Desktop nav links */}
        {!isMobile && (
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
        )}

        {/* Hamburger button — mobile only */}
        {isMobile && (
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '0.4rem', display: 'flex', flexDirection: 'column',
              gap: '5px', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <span style={{
              display: 'block', width: 22, height: 1.5,
              background: 'var(--text-1)', borderRadius: 1,
              transition: 'transform 0.3s',
              transform: menuOpen ? 'translateY(6.5px) rotate(45deg)' : 'none',
            }} />
            <span style={{
              display: 'block', width: 22, height: 1.5,
              background: 'var(--text-1)', borderRadius: 1,
              transition: 'opacity 0.3s',
              opacity: menuOpen ? 0 : 1,
            }} />
            <span style={{
              display: 'block', width: 22, height: 1.5,
              background: 'var(--text-1)', borderRadius: 1,
              transition: 'transform 0.3s',
              transform: menuOpen ? 'translateY(-6.5px) rotate(-45deg)' : 'none',
            }} />
          </button>
        )}
      </motion.nav>

      {/* Mobile dropdown menu */}
      <AnimatePresence>
        {isMobile && menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed', top: 57, left: 0, right: 0, zIndex: 999,
              background: 'rgba(5,5,5,0.97)', backdropFilter: 'blur(20px)',
              borderBottom: '1px solid var(--border)',
              padding: '1.5rem 2rem 2rem',
              display: 'flex', flexDirection: 'column', gap: '1.5rem',
            }}
          >
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={closeMenu}
                style={{
                  color: 'var(--text-2)', textDecoration: 'none',
                  fontSize: '1.1rem', fontWeight: 400,
                  fontFamily: 'var(--font-body)', letterSpacing: '-0.2px',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-2)'; }}
              >
                {l.label}
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
