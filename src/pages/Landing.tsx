import { Suspense, lazy, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, Variants } from 'framer-motion';
import WalletButton from '../components/WalletButton';

const AICore = lazy(() => import('../components/AICore'));
const NeuralBackground = lazy(() => import('../components/NeuralBackground'));

/* ── palette ─────────────────────────────────────────────────── */
const BLUE   = '#88B5FC';
const CYAN   = '#38B2F6';
const VIOLET = '#7E3FF2';
const SURFACE = 'rgba(8,18,38,0.65)';
const BORDER  = 'rgba(136,181,252,0.12)';

/* ── motion variants ─────────────────────────────────────────── */
const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 36 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] } },
};
const stagger: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.1 } },
};

/* ── data ────────────────────────────────────────────────────── */
const AGENTS = [
  {
    id: 'code-reader',
    icon: '◈', name: 'Code Reader Agent', sub: 'Maps the architecture',
    color: '#8B5CF6', rgb: '139,92,246',
    features: ['Architecture Map', 'Tech Stack Breakdown', 'Module Purpose Cards', 'Dependency Web'],
  },
  {
    id: 'simplifier',
    icon: '◇', name: 'Simplifier Agent', sub: 'Translates for humans',
    color: CYAN, rgb: '56,178,246',
    features: ['Onboarding Doc', 'README Generator', 'Jargon Glossary', 'Contribution Guide'],
  },
  {
    id: 'analogy',
    icon: '◆', name: 'Analogy Agent', sub: 'Tells the story',
    color: BLUE, rgb: '136,181,252',
    features: ['Code Flow Walkthrough', 'CEO Deck', 'Mermaid Flow Diagrams', 'Metaphor Engine'],
  },
  {
    id: 'insight',
    icon: '◉', name: 'Insight Agent', sub: 'Finds the risks',
    color: '#10B981', rgb: '16,185,129',
    features: ['Complexity Score', 'Risk Scan', 'Scalability Assessment', 'Tech Debt Summary'],
  },
];

const FLOW_STEPS = [
  { n: '01', title: 'Submit Repo', desc: 'Paste a GitHub URL. Agents deploy in seconds.', color: '#8B5CF6' },
  { n: '02', title: 'Agents Activate', desc: '4 AI agents spin up, each funded with HBAR.', color: BLUE },
  { n: '03', title: 'Work & Earn', desc: 'Each agent completes its task, paid on-chain.', color: CYAN },
  { n: '04', title: 'Insights Delivered', desc: 'Diagrams, reports, glossaries — all verified.', color: '#10B981' },
];

const STATS = [
  { v: '4', l: 'AI Agents' }, { v: '15', l: 'Features' },
  { v: '0', l: 'Smart Contracts' }, { v: '100%', l: 'On-Chain' }, { v: 'HBAR', l: 'Currency' },
];

const TECH = [
  { icon: '⬡', label: 'Hedera SDK', desc: 'Native blockchain — zero smart contracts' },
  { icon: '◈', label: 'Claude Sonnet 4.6', desc: 'The AI brain behind every agent' },
  { icon: '◇', label: 'HCS Audit Trail', desc: 'Every step logged permanently on-chain' },
  { icon: '⏰', label: 'Scheduled Tx', desc: 'Auto-refund with on-chain automation' },
];

/* ── component ───────────────────────────────────────────────── */
export default function Landing() {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const coreY   = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const heroOp  = useTransform(scrollYProgress, [0, 0.65], [1, 0]);

  return (
    <div className="ps2-root">
      <Suspense fallback={null}><NeuralBackground /></Suspense>

      {/* ── Nav ── */}
      <motion.nav
        className="ps2-nav"
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="ps2-logo">PAYSTREAM</span>
        <div className="ps2-nav-links">
          <a href="#flow">How It Works</a>
          <a href="#agents">Agents</a>
          <a href="#tech">Stack</a>
          <WalletButton />
          {/* ── CEO CTA pill ── */}
          <motion.button
            className="ps2-nav-ceo"
            onClick={() => navigate('/analyze')}
            whileHover={{ scale: 1.04, boxShadow: '0 0 28px rgba(136,181,252,0.35)' }}
            whileTap={{ scale: 0.97 }}
          >
            Can you explain this to my CEO? →
          </motion.button>
          <button onClick={() => navigate('/app')} className="ps2-nav-cta">
            Launch App <span style={{ opacity: 0.6 }}>→</span>
          </button>
        </div>
      </motion.nav>

      {/* ── Hero ── */}
      <section ref={heroRef} className="ps2-hero">
        {/* Ambient glow orbs */}
        <div className="ps2-orb ps2-orb-1" />
        <div className="ps2-orb ps2-orb-2" />
        <div className="ps2-orb ps2-orb-3" />

        <div className="ps2-hero-inner">
          {/* Left: text */}
          <motion.div className="ps2-hero-text" style={{ opacity: heroOp }}>
            {/* Badge */}
            <motion.div
              className="ps2-badge"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <span className="ps2-badge-dot" />
              ETHDenver 2026 &nbsp;·&nbsp; Hedera + Claude Sonnet
            </motion.div>

            {/* Title */}
            <div className="ps2-title-wrap">
              {(['PAY', 'STREAM'] as const).map((word, wi) => (
                <div key={wi} style={{ overflow: 'hidden' }}>
                  <motion.span
                    className={wi === 0 ? 'ps2-title-word ps2-word-pay' : 'ps2-title-word ps2-word-stream'}
                    initial={{ y: '110%' }}
                    animate={{ y: '0%' }}
                    transition={{ delay: 0.5 + wi * 0.14, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {word}
                  </motion.span>
                </div>
              ))}
            </div>

            {/* Tagline */}
            <motion.p
              className="ps2-tagline"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.95, duration: 0.8 }}
            >
              The Orchestrator that&nbsp;
              <span style={{ color: BLUE }}>Hires</span>,&nbsp;
              <span style={{ color: CYAN }}>Pays</span>, and&nbsp;
              <span style={{ color: VIOLET }}>Delivers</span>.
            </motion.p>

            <motion.p
              className="ps2-hero-sub"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.8 }}
            >
              PayStream is an AI agent payment model built on Hedera — no smart contracts, no Solidity.
              Drop a GitHub repo and watch 4 agents analyze it, pay each other in HBAR, and hand you a CEO-ready report.
            </motion.p>

            {/* Agent pills */}
            <motion.div
              className="ps2-pills"
              variants={stagger}
              initial="hidden"
              animate="visible"
              style={{ transitionDelay: '1.2s' } as React.CSSProperties}
            >
              {AGENTS.map(a => (
                <motion.span
                  key={a.id}
                  className="ps2-pill"
                  variants={fadeUp}
                  style={{ '--ac': a.color, '--ar': a.rgb } as React.CSSProperties}
                >
                  <span style={{ color: a.color }}>{a.icon}</span>{a.name.split(' ')[0]}
                </motion.span>
              ))}
            </motion.div>

            {/* CTAs — primary = CEO tool */}
            <motion.div
              className="ps2-ctas"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4, duration: 0.7 }}
            >
              <motion.button
                className="ps2-btn-primary"
                onClick={() => navigate('/analyze')}
                whileHover={{ scale: 1.03, boxShadow: '0 0 60px rgba(126,63,242,0.55)' }}
                whileTap={{ scale: 0.97 }}
              >
                <span>⬡</span> Can you explain this to my CEO?
              </motion.button>
              <a href="#flow" className="ps2-btn-ghost">Explore Platform →</a>
            </motion.div>
          </motion.div>

          {/* Right: 3D Core */}
          <motion.div
            className="ps2-core-wrap"
            style={{ y: coreY }}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <Suspense fallback={<div className="ps2-core-placeholder" />}>
              <AICore style={{ width: '100%', height: '100%' }} />
            </Suspense>
            {/* Ground glow */}
            <div className="ps2-core-glow" />
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="ps2-scroll-hint"
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
        >
          <div className="ps2-scroll-track"><div className="ps2-scroll-thumb" /></div>
          <span>scroll</span>
        </motion.div>
      </section>

      {/* ── Stats bar ── */}
      <motion.div
        className="ps2-statsbar"
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
      >
        {STATS.map(s => (
          <motion.div key={s.l} className="ps2-stat" variants={fadeUp}>
            <span className="ps2-stat-v">{s.v}</span>
            <span className="ps2-stat-l">{s.l}</span>
          </motion.div>
        ))}
      </motion.div>

      {/* ── LIVE USE CASE: Codebase Intelligence ── */}
      <section className="ps2-usecase-section">
        <motion.div
          className="ps2-usecase-glass"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="ps2-usecase-orb" />
          <div className="ps2-usecase-inner">
            <div className="ps2-usecase-left">
              <span className="ps2-eyebrow" style={{ color: 'rgba(56,178,246,0.7)' }}>LIVE USE CASE · BUILT ON PAYSTREAM</span>
              <h2 className="ps2-h2" style={{ marginBottom: 12, textAlign: 'left' }}>
                Codebase<br /><em>Intelligence</em>
              </h2>
              <p style={{ color: 'rgba(232,244,255,0.45)', fontSize: 14, lineHeight: 1.8, marginBottom: 28, maxWidth: 420 }}>
                Drop a GitHub URL. PayStream deploys 4 AI agents in parallel — each funded with HBAR, each paid on-chain after completing its task. You get an Architecture Map, CEO Deck, Risk Report, and Developer Docs. All on Hedera. No smart contracts.
              </p>
              <div className="ps2-usecase-features">
                {[
                  { icon: '◈', label: 'Architecture Map + Mermaid Diagram', color: '#8B5CF6' },
                  { icon: '◉', label: 'CEO Deck — 5 slides, ready to present', color: '#10B981' },
                  { icon: '◆', label: 'Risk Scan + Complexity Score', color: BLUE },
                  { icon: '◇', label: 'Dev Docs + Onboarding Guide', color: CYAN },
                ].map(f => (
                  <div key={f.label} className="ps2-usecase-feat">
                    <span style={{ color: f.color, fontSize: 14 }}>{f.icon}</span>
                    <span style={{ fontSize: 13, color: 'rgba(232,244,255,0.6)' }}>{f.label}</span>
                  </div>
                ))}
              </div>
              <motion.button
                className="ps2-btn-primary"
                onClick={() => navigate('/analyze')}
                style={{ marginTop: 32, width: 'fit-content' }}
                whileHover={{ scale: 1.03, boxShadow: '0 0 50px rgba(126,63,242,0.5)' }}
                whileTap={{ scale: 0.97 }}
              >
                <span>⬡</span> Can you explain this to my CEO?
              </motion.button>
            </div>

            <div className="ps2-usecase-right">
              <div className="ps2-usecase-terminal">
                <div className="ps2-terminal-bar">
                  <span className="ps2-t-dot" style={{ background: '#ff5f57' }} />
                  <span className="ps2-t-dot" style={{ background: '#ffbd2e' }} />
                  <span className="ps2-t-dot" style={{ background: '#28c840' }} />
                  <span style={{ marginLeft: 'auto', fontSize: 10, color: 'rgba(136,181,252,0.3)', fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1 }}>PAYSTREAM · LIVE</span>
                </div>
                <div className="ps2-terminal-body">
                  {[
                    { icon: '⬡', text: 'Fetching github.com/user/repo', color: 'rgba(136,181,252,0.5)', delay: 0 },
                    { icon: '◈', text: 'Code Reader Agent → funded 0.45 HBAR', color: '#8B5CF6', delay: 0.3 },
                    { icon: '◇', text: 'Simplifier Agent → funded 0.30 HBAR', color: CYAN, delay: 0.6 },
                    { icon: '◆', text: 'Analogy Agent → funded 0.37 HBAR', color: BLUE, delay: 0.9 },
                    { icon: '◉', text: 'Insight Agent → funded 0.38 HBAR', color: '#10B981', delay: 1.2 },
                    { icon: '✓', text: 'All agents paid on-chain · HCS logged', color: '#10B981', delay: 1.5 },
                    { icon: '⬡', text: 'Refunding 0.12 HBAR → your wallet', color: 'rgba(136,181,252,0.5)', delay: 1.8 },
                  ].map((line, i) => (
                    <motion.div
                      key={i}
                      className="ps2-t-line"
                      initial={{ opacity: 0, x: -8 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: line.delay + 0.3, duration: 0.5 }}
                    >
                      <span style={{ color: line.color, fontSize: 12, flexShrink: 0 }}>{line.icon}</span>
                      <span style={{ color: 'rgba(232,244,255,0.55)', fontSize: 12, fontFamily: "'JetBrains Mono',monospace" }}>{line.text}</span>
                    </motion.div>
                  ))}
                  <motion.div
                    className="ps2-t-cursor"
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ repeat: Infinity, duration: 1.1 }}
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Feature Flow ── */}
      <section id="flow" className="ps2-section">
        <motion.div
          className="ps2-section-head"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          <p className="ps2-eyebrow">THE PROCESS</p>
          <h2 className="ps2-h2">Submit a Repo.<br /><em>Watch Agents Earn.</em></h2>
          <p className="ps2-section-sub">
            Each agent has its own Hedera wallet, paid in HBAR for every task it completes.
          </p>
        </motion.div>

        <motion.div
          className="ps2-flow"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          {FLOW_STEPS.map((step, i) => (
            <motion.div key={i} className="ps2-flow-item" variants={fadeUp}>
              <motion.div
                className="ps2-flow-node"
                style={{ borderColor: step.color, color: step.color }}
                whileHover={{ boxShadow: `0 0 40px ${step.color}55`, scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                {step.n}
              </motion.div>
              {i < 3 && (
                <div className="ps2-flow-arrow">
                  <svg width="48" height="2" viewBox="0 0 48 2" fill="none">
                    <motion.line
                      x1="0" y1="1" x2="48" y2="1"
                      stroke="url(#flowGrad)" strokeWidth="1" strokeDasharray="4 3"
                      initial={{ pathLength: 0, opacity: 0 }}
                      whileInView={{ pathLength: 1, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.5 + i * 0.2, duration: 0.8 }}
                    />
                    <defs>
                      <linearGradient id="flowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={step.color} stopOpacity="0.4" />
                        <stop offset="100%" stopColor={FLOW_STEPS[i + 1]?.color || CYAN} stopOpacity="0.4" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              )}
              <h4 className="ps2-flow-title">{step.title}</h4>
              <p className="ps2-flow-desc">{step.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Agent Network Diagram ── */}
      <section className="ps2-network-section">
        <motion.div
          className="ps2-network-diagram"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 1 }}
        >
          {/* Central node */}
          <div className="ps2-net-center">
            <motion.div
              className="ps2-net-main"
              animate={{ boxShadow: ['0 0 30px rgba(126,63,242,0.4)', '0 0 60px rgba(126,63,242,0.7)', '0 0 30px rgba(126,63,242,0.4)'] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            >
              <span>MAIN<br />AGENT</span>
            </motion.div>
          </div>

          {/* Sub-agent nodes */}
          <div className="ps2-net-sub">
            {AGENTS.map((a, i) => (
              <motion.div
                key={a.id}
                className="ps2-net-node"
                style={{ '--ac': a.color, '--ar': a.rgb } as React.CSSProperties}
                initial={{ opacity: 0, scale: 0.7 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + i * 0.15, type: 'spring', stiffness: 200 }}
                whileHover={{ y: -6, boxShadow: `0 0 35px ${a.color}55` }}
              >
                <span className="ps2-net-icon" style={{ color: a.color }}>{a.icon}</span>
                <span>{a.name.replace(' Agent', '')}</span>
                <span className="ps2-net-sub-label">Agent</span>
              </motion.div>
            ))}
          </div>

          {/* Blockchain → User row */}
          <div className="ps2-net-bottom">
            {[
              { label: 'HEDERA', sub: 'Blockchain', color: CYAN, icon: '⬡' },
              { label: 'USER', sub: 'Insights Delivered', color: '#10B981', icon: '◉' },
            ].map(n => (
              <motion.div
                key={n.label}
                className="ps2-net-end"
                style={{ '--ac': n.color } as React.CSSProperties}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.9, duration: 0.7 }}
              >
                <span style={{ color: n.color, fontSize: 20 }}>{n.icon}</span>
                <span style={{ fontWeight: 700, color: n.color }}>{n.label}</span>
                <span style={{ fontSize: 11, color: 'rgba(232,244,255,0.35)' }}>{n.sub}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── Agent Showcase ── */}
      <section id="agents" className="ps2-section">
        <motion.div
          className="ps2-section-head"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          <p className="ps2-eyebrow">15 FEATURES · 4 AGENTS</p>
          <h2 className="ps2-h2">The Agent Network<br /><em>At a Glance</em></h2>
        </motion.div>

        <motion.div
          className="ps2-agent-grid"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          {AGENTS.map(a => (
            <motion.div
              key={a.id}
              className="ps2-agent-card"
              style={{ '--ac': a.color, '--ar': a.rgb } as React.CSSProperties}
              variants={fadeUp}
              whileHover={{ y: -10, transition: { type: 'spring', stiffness: 280, damping: 20 } }}
            >
              <div className="ps2-card-top-bar" style={{ background: `linear-gradient(90deg, ${a.color}50, transparent)` }} />
              <div className="ps2-card-header">
                <motion.div
                  className="ps2-card-icon"
                  whileHover={{ rotate: 15, scale: 1.15 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                >
                  {a.icon}
                </motion.div>
                <div>
                  <div className="ps2-card-name" style={{ color: a.color }}>{a.name}</div>
                  <div className="ps2-card-sub">{a.sub}</div>
                </div>
                <div className="ps2-card-hbar">pays in HBAR</div>
              </div>

              <div className="ps2-card-features">
                {a.features.map((f, fi) => (
                  <motion.div
                    key={fi}
                    className="ps2-feat"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: fi * 0.06 }}
                  >
                    <span className="ps2-feat-dot" style={{ background: a.color }} />
                    {f}
                  </motion.div>
                ))}
              </div>

              {/* Card hover glow */}
              <div className="ps2-card-glow" />
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Tech Stack ── */}
      <section id="tech" className="ps2-section ps2-tech-section">
        <motion.div
          className="ps2-section-head"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <p className="ps2-eyebrow">TECHNOLOGY</p>
          <h2 className="ps2-h2">Built on the<br /><em>Right Foundations</em></h2>
        </motion.div>

        <motion.div
          className="ps2-tech-grid"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          {TECH.map(t => (
            <motion.div
              key={t.label}
              className="ps2-tech-card"
              variants={fadeUp}
              whileHover={{ y: -6, borderColor: BORDER.replace('0.12', '0.4') }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            >
              <span className="ps2-tech-icon">{t.icon}</span>
              <span className="ps2-tech-label">{t.label}</span>
              <span className="ps2-tech-desc">{t.desc}</span>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Final CTA ── */}
      <section className="ps2-cta-section">
        <motion.div
          className="ps2-cta-glass"
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="ps2-cta-orb" />
          <p className="ps2-eyebrow">NO SETUP REQUIRED</p>
          <h2 className="ps2-h2" style={{ marginBottom: 16 }}>
            Understand Your Codebase<br /><em>in Minutes.</em>
          </h2>
          <p style={{ color: 'rgba(232,244,255,0.4)', lineHeight: 1.75, marginBottom: 40, fontSize: 15 }}>
            Runs on Hedera Testnet. No wallet setup. No configuration.<br />
            Just paste a repo and watch the agents work.
          </p>
          <motion.button
            className="ps2-btn-primary ps2-btn-large"
            onClick={() => navigate('/analyze')}
            whileHover={{ scale: 1.04, boxShadow: '0 0 80px rgba(126,63,242,0.6)' }}
            whileTap={{ scale: 0.97 }}
          >
            <span>⬡</span> Can you explain this to my CEO?
          </motion.button>
          <div className="ps2-cta-footnote">
            <span>Powered by</span>
            <span className="ps2-tech-pill">Hedera SDK</span>
            <span>+</span>
            <span className="ps2-tech-pill">Claude Sonnet 4.6</span>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="ps2-footer">
        <div className="ps2-footer-left">
          <span className="ps2-logo" style={{ fontSize: 13 }}>PAYSTREAM</span>
          <span style={{ fontSize: 11, color: 'rgba(232,244,255,0.2)', letterSpacing: '0.5px' }}>
            Multi-Agent AI Economy on Hedera
          </span>
        </div>
        <div style={{ fontSize: 11, color: 'rgba(232,244,255,0.15)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1 }}>
          ETHDenver 2026
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(232,244,255,0.2)' }}>
          <span>Built with</span>
          <span style={{ color: VIOLET, fontWeight: 600 }}>Hedera</span>
          <span>+</span>
          <span style={{ color: BLUE, fontWeight: 600 }}>Anthropic</span>
        </div>
      </footer>

      {/* ── Styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=JetBrains+Mono:wght@400;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }

        .ps2-root {
          background: #020B18;
          color: #E8F4FF;
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
          overflow-x: hidden;
        }

        /* ── Nav ── */
        .ps2-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 200;
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 52px;
          background: rgba(2,11,24,0.8);
          backdrop-filter: blur(28px);
          border-bottom: 1px solid rgba(136,181,252,0.07);
        }
        .ps2-logo {
          font-family: 'Orbitron', sans-serif;
          font-size: 15px; font-weight: 900; letter-spacing: 6px; color: #E8F4FF;
        }
        .ps2-nav-links { display: flex; align-items: center; gap: 28px; }
        .ps2-nav-links a {
          color: rgba(232,244,255,0.4); text-decoration: none;
          font-size: 13px; font-weight: 500; letter-spacing: 0.3px;
          transition: color 0.2s;
        }
        .ps2-nav-links a:hover { color: #E8F4FF; }

        /* CEO nav pill */
        .ps2-nav-ceo {
          padding: 9px 18px;
          background: linear-gradient(135deg, rgba(126,63,242,0.2) 0%, rgba(136,181,252,0.12) 100%);
          border: 1px solid rgba(136,181,252,0.35);
          border-radius: 8px; color: #88B5FC;
          font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 700;
          cursor: pointer; letter-spacing: 0.2px;
          transition: all 0.25s; white-space: nowrap;
        }
        .ps2-nav-ceo:hover {
          background: rgba(136,181,252,0.15);
          border-color: ${BLUE}; color: #E8F4FF;
        }

        .ps2-nav-cta {
          padding: 9px 20px; background: transparent;
          border: 1px solid rgba(136,181,252,0.28); color: ${BLUE};
          font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600;
          border-radius: 8px; cursor: pointer; letter-spacing: 0.3px;
          transition: all 0.25s;
        }
        .ps2-nav-cta:hover {
          background: rgba(136,181,252,0.08);
          border-color: ${BLUE}; color: #E8F4FF;
          box-shadow: 0 0 20px rgba(136,181,252,0.15);
        }

        /* ── Hero ── */
        .ps2-hero {
          position: relative; min-height: 100vh;
          display: flex; align-items: center;
          padding: 120px 52px 80px; overflow: hidden;
        }
        .ps2-orb {
          position: absolute; border-radius: 50%;
          pointer-events: none; filter: blur(90px);
        }
        .ps2-orb-1 {
          width: 700px; height: 700px;
          background: radial-gradient(circle, rgba(126,63,242,0.12), transparent 70%);
          top: -100px; right: -100px;
        }
        .ps2-orb-2 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(56,178,246,0.08), transparent 70%);
          bottom: 0; left: 0;
        }
        .ps2-orb-3 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(136,181,252,0.06), transparent 70%);
          top: 40%; left: 40%;
        }
        .ps2-hero-inner {
          position: relative; z-index: 2;
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 60px; align-items: center;
          max-width: 1360px; margin: 0 auto; width: 100%;
        }
        .ps2-hero-text { display: flex; flex-direction: column; gap: 0; }

        /* Badge */
        .ps2-badge {
          display: inline-flex; align-items: center; gap: 10px;
          padding: 8px 18px; border-radius: 100px;
          border: 1px solid rgba(136,181,252,0.22);
          background: rgba(136,181,252,0.06);
          font-family: 'JetBrains Mono', monospace;
          font-size: 10.5px; color: rgba(136,181,252,0.75);
          letter-spacing: 1.8px; text-transform: uppercase;
          width: fit-content; margin-bottom: 36px;
        }
        .ps2-badge-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: ${CYAN};
          box-shadow: 0 0 10px ${CYAN};
          animation: ps2-blink 2s ease-in-out infinite;
        }

        /* Title */
        .ps2-title-wrap { margin-bottom: 28px; }
        .ps2-title-word {
          display: block;
          font-family: 'Orbitron', sans-serif;
          font-size: clamp(56px, 8.5vw, 108px);
          font-weight: 900; letter-spacing: -1px; line-height: 0.92;
        }
        .ps2-word-pay {
          background: linear-gradient(140deg, #E8F4FF 0%, ${BLUE} 55%, ${CYAN} 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .ps2-word-stream {
          background: linear-gradient(140deg, ${BLUE} 0%, ${VIOLET} 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .ps2-tagline {
          font-size: clamp(16px, 2vw, 22px); font-weight: 400;
          color: rgba(232,244,255,0.75); line-height: 1.5;
          margin-bottom: 14px;
        }
        .ps2-hero-sub {
          font-size: 14px; color: rgba(232,244,255,0.35);
          line-height: 1.8; margin-bottom: 32px; max-width: 440px;
        }

        /* Pills */
        .ps2-pills { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 40px; }
        .ps2-pill {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 6px 14px;
          background: rgba(var(--ar), 0.06);
          border: 1px solid rgba(var(--ar), 0.18);
          border-radius: 6px; font-size: 12px;
          color: rgba(232,244,255,0.55);
          font-family: 'JetBrains Mono', monospace; letter-spacing: 0.3px;
          transition: all 0.25s; cursor: default;
        }
        .ps2-pill:hover {
          background: rgba(var(--ar), 0.1);
          border-color: rgba(var(--ar), 0.35);
          color: rgba(232,244,255,0.85);
        }

        /* CTAs */
        .ps2-ctas { display: flex; align-items: center; gap: 24px; flex-wrap: wrap; }
        .ps2-btn-primary {
          display: inline-flex; align-items: center; gap: 10px;
          padding: 14px 32px;
          background: linear-gradient(135deg, ${VIOLET} 0%, #4F46E5 100%);
          color: #fff; font-family: 'DM Sans', sans-serif;
          font-size: 15px; font-weight: 700; border: none;
          border-radius: 10px; cursor: pointer; letter-spacing: 0.3px;
          box-shadow: 0 0 40px rgba(126,63,242,0.4), inset 0 1px 0 rgba(255,255,255,0.12);
          transition: all 0.3s; position: relative; overflow: hidden;
        }
        .ps2-btn-primary:hover { transform: translateY(-2px); }
        .ps2-btn-large { padding: 18px 48px; font-size: 16px; }
        .ps2-btn-ghost {
          color: rgba(136,181,252,0.6); font-size: 14px; text-decoration: none;
          font-weight: 500; transition: color 0.2s;
        }
        .ps2-btn-ghost:hover { color: ${BLUE}; }

        /* Core wrap */
        .ps2-core-wrap { height: 580px; position: relative; }
        .ps2-core-placeholder { width: 100%; height: 100%; }
        .ps2-core-glow {
          position: absolute; bottom: -20px; left: 50%;
          transform: translateX(-50%);
          width: 280px; height: 12px;
          background: ${VIOLET}; border-radius: 50%; opacity: 0.2;
          filter: blur(20px);
        }

        /* Scroll hint */
        .ps2-scroll-hint {
          position: absolute; bottom: 32px; left: 50%;
          transform: translateX(-50%);
          display: flex; flex-direction: column; align-items: center; gap: 10px;
          color: rgba(232,244,255,0.2); font-size: 9px;
          letter-spacing: 3px; text-transform: uppercase;
          font-family: 'JetBrains Mono', monospace;
        }
        .ps2-scroll-track {
          width: 22px; height: 38px;
          border: 1.5px solid rgba(136,181,252,0.2);
          border-radius: 11px; display: flex; justify-content: center; padding-top: 5px;
        }
        .ps2-scroll-thumb {
          width: 3px; height: 10px;
          background: ${BLUE}; border-radius: 2px; opacity: 0.5;
        }

        /* ── Stats ── */
        .ps2-statsbar {
          position: relative; z-index: 2;
          display: flex; justify-content: center;
          border-top: 1px solid rgba(255,255,255,0.04);
          border-bottom: 1px solid rgba(255,255,255,0.04);
          background: rgba(136,181,252,0.015);
        }
        .ps2-stat {
          flex: 1; max-width: 200px; text-align: center;
          padding: 36px 16px;
          border-right: 1px solid rgba(255,255,255,0.04);
        }
        .ps2-stat:last-child { border-right: none; }
        .ps2-stat-v {
          display: block; font-family: 'Orbitron', sans-serif;
          font-size: 38px; font-weight: 900; color: ${BLUE};
          margin-bottom: 8px; line-height: 1;
          text-shadow: 0 0 30px rgba(136,181,252,0.4);
        }
        .ps2-stat-l {
          font-size: 10px; color: rgba(232,244,255,0.28);
          letter-spacing: 2.5px; text-transform: uppercase;
          font-family: 'JetBrains Mono', monospace;
        }

        /* ── Use Case Section ── */
        .ps2-usecase-section {
          position: relative; z-index: 2;
          padding: 80px 52px;
        }
        .ps2-usecase-glass {
          position: relative;
          max-width: 1200px; margin: 0 auto;
          padding: 56px 64px;
          background: rgba(126,63,242,0.04);
          border: 1px solid rgba(56,178,246,0.18);
          border-radius: 24px;
          backdrop-filter: blur(30px);
          box-shadow: 0 0 120px rgba(56,178,246,0.06), inset 0 1px 0 rgba(255,255,255,0.04);
          overflow: hidden;
        }
        .ps2-usecase-orb {
          position: absolute; top: -120px; right: -80px;
          width: 500px; height: 500px; border-radius: 50%;
          background: radial-gradient(circle, rgba(56,178,246,0.1), transparent 65%);
          filter: blur(60px); pointer-events: none;
        }
        .ps2-usecase-inner {
          position: relative; z-index: 1;
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 60px; align-items: center;
        }
        .ps2-usecase-left { display: flex; flex-direction: column; }
        .ps2-usecase-features { display: flex; flex-direction: column; gap: 12px; }
        .ps2-usecase-feat {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 14px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.04);
          border-radius: 8px;
        }

        /* Terminal */
        .ps2-usecase-right { position: relative; }
        .ps2-usecase-terminal {
          background: rgba(4,12,28,0.9);
          border: 1px solid rgba(136,181,252,0.12);
          border-radius: 14px; overflow: hidden;
          backdrop-filter: blur(20px);
          box-shadow: 0 0 60px rgba(0,0,0,0.4);
        }
        .ps2-terminal-bar {
          display: flex; align-items: center; gap: 7px;
          padding: 12px 16px;
          background: rgba(255,255,255,0.03);
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .ps2-t-dot { width: 10px; height: 10px; border-radius: 50%; }
        .ps2-terminal-body {
          padding: 20px; display: flex; flex-direction: column; gap: 10px;
          min-height: 240px;
        }
        .ps2-t-line {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 6px 0;
          border-bottom: 1px solid rgba(255,255,255,0.03);
        }
        .ps2-t-cursor {
          width: 8px; height: 14px;
          background: ${BLUE}; border-radius: 2px;
          margin-top: 6px;
        }

        /* ── Sections ── */
        .ps2-section {
          position: relative; z-index: 2;
          padding: 100px 52px; max-width: 1360px; margin: 0 auto;
        }
        .ps2-section-head { text-align: center; margin-bottom: 72px; }
        .ps2-eyebrow {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; letter-spacing: 3.5px;
          color: rgba(136,181,252,0.55); text-transform: uppercase; margin-bottom: 16px;
        }
        .ps2-h2 {
          font-family: 'Orbitron', sans-serif;
          font-size: clamp(28px, 4vw, 50px); font-weight: 700;
          color: #E8F4FF; line-height: 1.15; letter-spacing: -0.5px; margin-bottom: 16px;
        }
        .ps2-h2 em { font-style: italic; color: ${BLUE}; }
        .ps2-section-sub { font-size: 15px; color: rgba(232,244,255,0.4); line-height: 1.75; max-width: 480px; margin: 0 auto; }

        /* ── Flow ── */
        .ps2-flow {
          display: flex; align-items: flex-start; justify-content: center;
          gap: 0; flex-wrap: wrap;
        }
        .ps2-flow-item {
          flex: 1; min-width: 180px; max-width: 240px;
          text-align: center; padding: 0 16px;
          display: flex; flex-direction: column; align-items: center;
        }
        .ps2-flow-node {
          width: 56px; height: 56px; border-radius: 50%;
          border: 1px solid; display: flex; align-items: center; justify-content: center;
          margin: 0 auto 20px; font-family: 'Orbitron', monospace;
          font-size: 12px; font-weight: 700;
          background: rgba(2,11,24,0.9);
          transition: all 0.3s; cursor: default;
        }
        .ps2-flow-arrow {
          position: absolute; top: 27px; right: -12px;
          pointer-events: none;
        }
        .ps2-flow-item { position: relative; }
        .ps2-flow-title {
          font-size: 14px; font-weight: 700; color: #E8F4FF; margin-bottom: 8px;
        }
        .ps2-flow-desc { font-size: 12.5px; color: rgba(232,244,255,0.35); line-height: 1.65; }

        /* ── Network Diagram ── */
        .ps2-network-section {
          position: relative; z-index: 2; padding: 60px 52px;
          background: rgba(136,181,252,0.015);
          border-top: 1px solid rgba(255,255,255,0.03);
          border-bottom: 1px solid rgba(255,255,255,0.03);
        }
        .ps2-network-diagram {
          max-width: 900px; margin: 0 auto;
          display: flex; flex-direction: column; align-items: center; gap: 40px;
        }
        .ps2-net-center { display: flex; justify-content: center; }
        .ps2-net-main {
          width: 120px; height: 120px; border-radius: 50%;
          background: rgba(126,63,242,0.15);
          border: 2px solid rgba(126,63,242,0.5);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Orbitron', sans-serif; font-size: 10px; font-weight: 900;
          color: ${VIOLET}; text-align: center; letter-spacing: 1px;
          cursor: default;
        }
        .ps2-net-sub {
          display: flex; gap: 24px; flex-wrap: wrap; justify-content: center;
        }
        .ps2-net-node {
          display: flex; flex-direction: column; align-items: center; gap: 6px;
          padding: 18px 22px;
          background: rgba(var(--ar, 136,181,252), 0.06);
          border: 1px solid rgba(var(--ar, 136,181,252), 0.2);
          border-radius: 14px;
          font-size: 11px; font-weight: 700; color: rgba(232,244,255,0.7);
          font-family: 'JetBrains Mono', monospace; letter-spacing: 0.5px;
          cursor: default; transition: all 0.3s;
          min-width: 120px;
        }
        .ps2-net-icon { font-size: 22px; }
        .ps2-net-sub-label { font-size: 9px; color: rgba(232,244,255,0.3); letter-spacing: 1.5px; font-weight: 400; }
        .ps2-net-bottom { display: flex; gap: 40px; flex-wrap: wrap; justify-content: center; }
        .ps2-net-end {
          display: flex; flex-direction: column; align-items: center; gap: 6px;
          padding: 18px 28px;
          background: rgba(var(--ar, 136,181,252), 0.05);
          border: 1px solid rgba(var(--ar, 136,181,252), 0.18);
          border-radius: 14px;
          font-family: 'JetBrains Mono', monospace; font-size: 11px; letter-spacing: 1px;
          min-width: 140px;
        }

        /* ── Agent Grid ── */
        .ps2-agent-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }
        .ps2-agent-card {
          position: relative; padding: 0;
          background: ${SURFACE};
          border: 1px solid ${BORDER};
          border-radius: 18px; overflow: hidden;
          backdrop-filter: blur(20px);
          cursor: default;
        }
        .ps2-card-top-bar { height: 2px; width: 100%; }
        .ps2-card-header {
          display: flex; align-items: center; gap: 14px;
          padding: 22px 22px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .ps2-card-icon {
          font-size: 26px; color: var(--ac);
          width: 44px; height: 44px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(var(--ar), 0.1);
          border: 1px solid rgba(var(--ar), 0.25); border-radius: 12px;
          flex-shrink: 0; cursor: default;
        }
        .ps2-card-name { font-size: 14px; font-weight: 700; color: var(--ac); margin-bottom: 2px; }
        .ps2-card-sub { font-size: 11px; color: rgba(232,244,255,0.35); letter-spacing: 0.3px; }
        .ps2-card-hbar {
          margin-left: auto; font-family: 'JetBrains Mono', monospace;
          font-size: 9px; color: rgba(var(--ar), 0.5);
          letter-spacing: 1.5px; text-transform: uppercase;
          padding: 4px 8px; border: 1px solid rgba(var(--ar), 0.18); border-radius: 4px;
          white-space: nowrap;
        }
        .ps2-card-features { padding: 16px 22px 22px; display: flex; flex-direction: column; gap: 10px; }
        .ps2-feat {
          display: flex; align-items: center; gap: 10px;
          font-size: 12.5px; color: rgba(232,244,255,0.55);
        }
        .ps2-feat-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
        .ps2-card-glow {
          position: absolute; bottom: -60px; right: -60px;
          width: 150px; height: 150px; border-radius: 50%;
          background: radial-gradient(circle, rgba(var(--ar), 0.12), transparent 70%);
          pointer-events: none; transition: opacity 0.3s;
          opacity: 0;
        }
        .ps2-agent-card:hover .ps2-card-glow { opacity: 1; }

        /* ── Tech ── */
        .ps2-tech-section { background: rgba(126,63,242,0.015); }
        .ps2-tech-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 14px; max-width: 1000px; margin: 0 auto;
        }
        .ps2-tech-card {
          display: flex; flex-direction: column; gap: 8px;
          padding: 24px; background: ${SURFACE};
          border: 1px solid ${BORDER}; border-radius: 14px;
          backdrop-filter: blur(16px); transition: all 0.3s; cursor: default;
        }
        .ps2-tech-icon { font-size: 22px; color: ${BLUE}; }
        .ps2-tech-label { font-size: 14px; font-weight: 700; color: #E8F4FF; }
        .ps2-tech-desc { font-size: 12px; color: rgba(232,244,255,0.35); line-height: 1.55; }
        .ps2-tech-pill { color: ${VIOLET}; font-weight: 600; }

        /* ── CTA ── */
        .ps2-cta-section {
          position: relative; z-index: 2;
          padding: 100px 52px; display: flex; justify-content: center;
        }
        .ps2-cta-glass {
          position: relative; text-align: center;
          max-width: 680px; width: 100%;
          padding: 80px 64px;
          background: rgba(126,63,242,0.04);
          border: 1px solid rgba(126,63,242,0.18);
          border-radius: 24px;
          backdrop-filter: blur(30px);
          box-shadow: 0 0 120px rgba(126,63,242,0.07), inset 0 1px 0 rgba(255,255,255,0.04);
          overflow: hidden;
        }
        .ps2-cta-orb {
          position: absolute; top: -120px; left: 50%; transform: translateX(-50%);
          width: 500px; height: 500px; border-radius: 50%;
          background: radial-gradient(circle, rgba(126,63,242,0.18), transparent 65%);
          filter: blur(50px); pointer-events: none;
        }
        .ps2-cta-footnote {
          display: flex; align-items: center; justify-content: center;
          gap: 8px; margin-top: 22px; font-size: 12px; color: rgba(232,244,255,0.28);
        }

        /* ── Footer ── */
        .ps2-footer {
          position: relative; z-index: 2;
          display: flex; justify-content: space-between; align-items: center;
          padding: 28px 52px;
          border-top: 1px solid rgba(255,255,255,0.04);
          flex-wrap: wrap; gap: 16px;
        }
        .ps2-footer-left { display: flex; flex-direction: column; gap: 5px; }

        /* ── Keyframes ── */
        @keyframes ps2-blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.35; }
        }

        /* ── Responsive ── */
        @media (max-width: 900px) {
          .ps2-hero-inner { grid-template-columns: 1fr; gap: 40px; }
          .ps2-core-wrap { height: 380px; }
          .ps2-nav { padding: 16px 24px; }
          .ps2-nav-links a, .ps2-nav-ceo { display: none; }
          .ps2-hero { padding: 100px 24px 60px; }
          .ps2-section { padding: 70px 24px; }
          .ps2-cta-glass { padding: 48px 28px; }
          .ps2-footer { padding: 24px 24px; }
          .ps2-usecase-inner { grid-template-columns: 1fr; }
          .ps2-usecase-glass { padding: 36px 24px; }
        }
      `}</style>
    </div>
  );
}
