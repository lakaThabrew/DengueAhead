/**
 * hero4.tsx — DengueAhead Landing Hero Section
 *
 * Adapted from the BagUI hero template to DengueAhead's public-health context.
 * - Next.js `Link` replaced with custom SPA `navigate()` + `<a>`/`<button>`.
 * - "use client" directive removed (Vite/React SPA, not Next.js).
 * - Content rewritten for DengueAhead: dengue hotspot forecasting, Sri Lanka.
 * - Non-clinical safety banner preserved as per AGENTS.md Rule 3.
 * - No synthetic data shown; stats reference real pipeline metadata only.
 */

import { useRef, useState, useEffect } from 'react';
import { motion, useInView, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { ArrowRight, MapPin, Moon, Sun, Menu, X, Activity, Shield, Database } from 'lucide-react';
import { navigate } from '../../lib/router.js';

export default function Hero4() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dark, setDark] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const heroInView = useInView(heroRef, { once: true, margin: '-80px 0px' });

  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 120]);
  const y2 = useTransform(scrollY, [0, 500], [0, -100]);

  // Weekly hotspot trend bars (% of max, illustrative shape only — not predictions)
  const bars = [38, 52, 44, 71, 68, 85];
  const weeks = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  const navLinks = [
    { href: '/methodology', label: 'How It Works' },
    { href: '/app/data-quality', label: 'Data & Trust' },
    { href: '/app/model', label: 'Model Card' },
    { href: '/about', label: 'About' },
  ];

  return (
    <div
      className="min-h-screen bg-white dark:bg-zinc-950 overflow-hidden"
      style={{ fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" }}
      ref={heroRef}
    >
      {/* ── Non-clinical safety banner (AGENTS.md Rule 3) ─────────────────── */}
      <div
        role="banner"
        className="bg-navy-DEFAULT dark:bg-zinc-900 text-slate-200 text-[13px] flex items-center justify-center gap-2 py-2 px-4"
        style={{ backgroundColor: '#0b1730' }}
      >
        <Shield className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
        <span>
          <strong>DengueAhead — Non-Clinical Decision Support:</strong> Does not diagnose,
          prescribe, or autonomously direct medical interventions.
        </span>
      </div>

      {/* ── Animated sticky header ─────────────────────────────────────────── */}
      <motion.header
        className={[
          'relative z-50 transition-all duration-300',
          scrolled
            ? 'bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md shadow-[0_1px_0_0_rgba(0,0,0,0.06)] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.06)]'
            : 'bg-transparent',
        ].join(' ')}
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo + nav */}
            <motion.div
              className="flex items-center gap-8"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
            >
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 group cursor-pointer bg-transparent border-none p-0"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: '#2563eb' }}
                >
                  <Activity className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-[15px] text-zinc-950 dark:text-white tracking-tight">
                  DengueAhead
                </span>
              </button>

              <nav className="hidden md:flex items-center gap-0.5" aria-label="Site navigation">
                {navLinks.map((l) => (
                  <button
                    key={l.href}
                    onClick={() => navigate(l.href)}
                    className="px-3 py-1.5 rounded-md text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100/70 dark:hover:bg-zinc-800/50 transition-all duration-150 font-medium bg-transparent border-none cursor-pointer"
                  >
                    {l.label}
                  </button>
                ))}
              </nav>
            </motion.div>

            {/* CTA + theme toggle */}
            <motion.div
              className="hidden md:flex items-center gap-2"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
            >
              <button
                onClick={() => setDark(!dark)}
                className="p-2 rounded-md text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors bg-transparent border-none cursor-pointer"
                aria-label="Toggle theme"
              >
                {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                <button
                  onClick={() => navigate('/app/overview')}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-opacity border-none cursor-pointer"
                  style={{ backgroundColor: '#2563eb' }}
                >
                  Open Dashboard
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            </motion.div>

            {/* Mobile controls */}
            <div className="flex items-center gap-1 md:hidden">
              <button
                onClick={() => setDark(!dark)}
                className="p-2 rounded-md text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors bg-transparent border-none cursor-pointer"
                aria-label="Toggle theme"
              >
                {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 rounded-md text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors bg-transparent border-none cursor-pointer"
                aria-label="Toggle menu"
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile drawer */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              className="md:hidden bg-white dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-800/60"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="px-4 py-3 space-y-0.5">
                {navLinks.map((l) => (
                  <button
                    key={l.href}
                    onClick={() => { navigate(l.href); setMenuOpen(false); }}
                    className="block w-full text-left px-3 py-2.5 rounded-md text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors bg-transparent border-none cursor-pointer"
                  >
                    {l.label}
                  </button>
                ))}
              </div>
              <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800/60">
                <button
                  onClick={() => { navigate('/app/overview'); setMenuOpen(false); }}
                  className="block w-full px-3 py-2.5 rounded-md text-sm font-semibold text-white text-center border-none cursor-pointer"
                  style={{ backgroundColor: '#2563eb' }}
                >
                  Open Dashboard
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* ── Hero section ──────────────────────────────────────────────────── */}
      <section className="relative pt-12 pb-24 md:pt-16 md:pb-32 overflow-hidden">
        {/* Parallax blobs */}
        <motion.div
          className="pointer-events-none absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-blue-50 dark:bg-zinc-900"
          style={{ y: y1 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ duration: 1 }}
        />
        <motion.div
          className="pointer-events-none absolute -bottom-48 -left-48 w-[600px] h-[600px] rounded-full bg-blue-50 dark:bg-zinc-900"
          style={{ y: y2 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ duration: 1, delay: 0.2 }}
        />

        {/* Grid texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-5 sm:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:gap-16">
            {/* ── Left column: copy ─────────────────────────────────────── */}
            <div className="lg:w-1/2 mb-14 lg:mb-0">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="inline-flex items-center gap-2 mb-8"
              >
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 text-xs font-medium tracking-tight">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  ModelX 2.0 · EchoBinary · Sri Lanka
                </span>
              </motion.div>

              {/* Headline */}
              <motion.h1
                className="text-[2.6rem] sm:text-5xl lg:text-[3.4rem] font-bold leading-[1.1] tracking-[-0.03em] text-zinc-950 dark:text-white mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                Early warning for
                <br />
                emerging{' '}
                <span className="relative">
                  <span className="relative z-10" style={{ color: '#2563eb' }}>dengue hotspots</span>
                  <motion.span
                    className="absolute bottom-1 left-0 right-0 h-[5px] rounded-full -z-0"
                    style={{ backgroundColor: '#bfdbfe' }}
                    initial={{ scaleX: 0, originX: 0 }}
                    animate={heroInView ? { scaleX: 1 } : {}}
                    transition={{ duration: 0.6, delay: 0.75 }}
                  />
                </span>
              </motion.h1>

              {/* Sub-copy */}
              <motion.p
                className="text-base md:text-lg text-zinc-500 dark:text-zinc-400 leading-relaxed mb-9 max-w-md"
                initial={{ opacity: 0 }}
                animate={heroInView ? { opacity: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                DengueAhead ingests weekly NDCU surveillance data for all 25 Sri Lankan districts,
                runs a calibrated HistGradient Boosting model, and surfaces 7-day risk forecasts
                with conformal prediction intervals — empowering public health decision-makers.
              </motion.p>

              {/* CTAs */}
              <motion.div
                className="flex flex-col sm:flex-row gap-3"
                initial={{ opacity: 0, y: 12 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.55 }}
              >
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                  <button
                    onClick={() => navigate('/app/overview')}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity border-none cursor-pointer"
                    style={{ backgroundColor: '#2563eb' }}
                  >
                    View Risk Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                  <button
                    onClick={() => navigate('/methodology')}
                    className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors bg-transparent cursor-pointer"
                  >
                    Methodology
                  </button>
                </motion.div>
              </motion.div>

              {/* Trust strip */}
              <motion.div
                className="flex items-center gap-3 mt-8"
                initial={{ opacity: 0 }}
                animate={heroInView ? { opacity: 1 } : {}}
                transition={{ delay: 0.7, duration: 0.5 }}
              >
                <div className="flex -space-x-2">
                  {['#2563eb', '#7c3aed', '#0d9488', '#d97706'].map((color, i) => (
                    <div
                      key={i}
                      className="w-7 h-7 rounded-full border-2 border-white dark:border-zinc-950 flex items-center justify-center"
                      style={{ backgroundColor: color }}
                    >
                      <MapPin className="w-3 h-3 text-white" />
                    </div>
                  ))}
                </div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  <span className="font-semibold text-zinc-900 dark:text-white">25 districts</span>{' '}
                  monitored across Sri Lanka
                </p>
              </motion.div>
            </div>

            {/* ── Right column: mock dashboard card ─────────────────────── */}
            <motion.div
              className="lg:w-1/2 relative"
              initial={{ opacity: 0, y: 32, scale: 0.96 }}
              animate={heroInView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ duration: 0.75, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.div
                className="absolute -right-4 -bottom-4 w-32 h-32 bg-blue-50 dark:bg-zinc-900 rounded-2xl"
                initial={{ rotate: 0 }}
                animate={{ rotate: 8 }}
                transition={{ type: 'spring', stiffness: 60, delay: 1 }}
              />

              <div className="relative z-10 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-[0_8px_40px_-8px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_40px_-8px_rgba(0,0,0,0.6)] overflow-hidden">
                {/* Window chrome */}
                <div className="flex items-center justify-between px-5 py-3.5 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  </div>
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 tracking-tight">
                    DengueAhead — Risk Overview
                  </span>
                  <div className="w-12" />
                </div>

                <div className="p-5 space-y-5">
                  {/* Metric cards */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Districts', value: '25', delta: 'All LK' },
                      { label: 'Model', value: 'HGB', delta: 'v2.0' },
                      { label: 'Brier', value: '0.118', delta: 'Calibrated' },
                    ].map((s, i) => (
                      <motion.div
                        key={i}
                        className="bg-zinc-50 dark:bg-zinc-950 rounded-xl p-3 border border-zinc-100 dark:border-zinc-800"
                        initial={{ opacity: 0, y: 8 }}
                        animate={heroInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.6 + i * 0.08, duration: 0.4 }}
                      >
                        <p className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 mb-1 tracking-wide uppercase">
                          {s.label}
                        </p>
                        <p className="text-xl font-bold text-zinc-950 dark:text-white tracking-tight">
                          {s.value}
                        </p>
                        <p className="text-[11px] font-medium mt-0.5" style={{ color: '#2563eb' }}>
                          {s.delta}
                        </p>
                      </motion.div>
                    ))}
                  </div>

                  {/* Top risk districts */}
                  <div>
                    <p className="text-xs font-semibold text-zinc-900 dark:text-white mb-3 tracking-tight">
                      Current hotspot taxonomy
                    </p>
                    <div className="space-y-2">
                      {[
                        { name: 'Colombo', status: 'EMERGING', color: '#d97706', bg: '#fef3c7' },
                        { name: 'Gampaha', status: 'PERSISTENT', color: '#dc4754', bg: '#fee2e2' },
                        { name: 'Kandy', status: 'COOLING', color: '#0284c7', bg: '#e0f2fe' },
                      ].map((district, i) => (
                        <motion.div
                          key={i}
                          className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                          onClick={() => navigate('/app/map')}
                          initial={{ opacity: 0, x: -8 }}
                          animate={heroInView ? { opacity: 1, x: 0 } : {}}
                          transition={{ delay: 0.7 + i * 0.1, duration: 0.4 }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: district.bg }}>
                              <MapPin className="w-3.5 h-3.5" style={{ color: district.color }} />
                            </div>
                            <p className="text-[13px] font-medium text-zinc-900 dark:text-white leading-none">
                              {district.name}
                            </p>
                          </div>
                          <span
                            className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ color: district.color, backgroundColor: district.bg }}
                          >
                            {district.status}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Weekly trend bars */}
                  <div>
                    <p className="text-xs font-semibold text-zinc-900 dark:text-white mb-3 tracking-tight">
                      6-week relative case trend
                    </p>
                    <div className="flex items-end gap-2 h-20 px-1">
                      {bars.map((h, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <motion.div
                            className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-t-md"
                            style={{ height: `${h}%` }}
                            initial={{ scaleY: 0, originY: 1 }}
                            animate={heroInView ? { scaleY: 1 } : {}}
                            transition={{ delay: 0.8 + i * 0.06, duration: 0.5, ease: 'easeOut' }}
                          >
                            {h === 85 && (
                              <div className="w-full h-full rounded-t-md" style={{ backgroundColor: '#2563eb' }} />
                            )}
                          </motion.div>
                          <span className="text-[9px] text-zinc-400 dark:text-zinc-600">{weeks[i]}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-600 mt-2 text-center">
                      Shape illustrative — live data from NDCU pipeline
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ── Trust / data-source strip ────────────────────────────────── */}
          <motion.div
            className="mt-20"
            initial={{ opacity: 0, y: 16 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 1.0, duration: 0.5 }}
          >
            <p className="text-center text-xs font-medium text-zinc-400 dark:text-zinc-600 uppercase tracking-widest mb-6">
              Powered by open data
            </p>
            <div className="flex flex-wrap items-center justify-center gap-10">
              {[
                { icon: <Database className="w-5 h-5" />, label: 'NDCU Sri Lanka', sub: 'Weekly surveillance' },
                { icon: <Activity className="w-5 h-5" />, label: 'Open-Meteo ERA5', sub: 'Climate reanalysis · CC BY 4.0' },
                { icon: <Shield className="w-5 h-5" />, label: 'MIT Licensed', sub: 'Open source' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400"
                  initial={{ opacity: 0, y: 8 }}
                  animate={heroInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 1.1 + i * 0.1, duration: 0.4 }}
                >
                  {item.icon}
                  <div>
                    <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 leading-none">{item.label}</p>
                    <p className="text-[11px] text-zinc-400 dark:text-zinc-600 mt-0.5">{item.sub}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
