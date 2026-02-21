import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import MermaidDiagram from '../components/MermaidDiagram';

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = 'idle' | 'fetching' | 'analyzing' | 'complete';
type Tab = 'architecture' | 'techstack' | 'insights' | 'ceodeck' | 'devdocs';

interface AgentStatus {
  name: string;
  key: string;
  status: 'pending' | 'working' | 'complete' | 'error';
  payment: number;
  txId: string;
  allocation: number;
}

interface RepoMeta {
  repoName: string;
  fileCount: number;
  languages: string[];
}

interface TechItem   { name: string; version?: string; role: string; category: string }
interface Module     { path: string; purpose: string; type: string }
interface Dependency { name: string; purpose: string; risk: string; riskReason?: string }
interface GlossaryItem { term: string; plain: string }
interface TechAnalogy  { tech: string; analogy: string; what: string }
interface CEOSlide     { slideNumber: number; title: string; content: string; speakerNote: string }
interface RedFlag      { severity: string; issue: string; location: string; suggestion: string }
interface TechDebtItem { item: string; effort: string; impact: string }

interface CodeReaderResult {
  architectureMap: { mermaid: string; description: string };
  techStack: TechItem[];
  modules: Module[];
  dependencies: Dependency[];
}
interface SimplifierResult {
  codeFlow: string;
  glossary: GlossaryItem[];
  onboardingDoc: string;
}
interface AnalogyResult {
  techAnalogies: TechAnalogy[];
  ceoSlides: CEOSlide[];
}
interface InsightResult {
  complexityScore: { score: number; label: string; reasoning: string; cleanParts?: string; overEngineered?: string };
  redFlags: RedFlag[];
  scalability: { canHandle10x: boolean; bottleneck: string; assessment: string };
  techDebt: TechDebtItem[];
  rebuildSuggestion: string;
}
interface AnalysisData {
  codeReader?: CodeReaderResult;
  simplifier?: SimplifierResult;
  analogy?: AnalogyResult;
  insight?: InsightResult;
}

// ─── Agent definitions — always rendered (pending → working → complete) ───────

const AGENT_DEFS = [
  { name: 'Code Reader Agent', color: '#8B5CF6', role: 'Architecture · Map',     icon: '◈' },
  { name: 'Simplifier Agent',  color: '#38B2F6', role: 'Flow · Docs · Glossary', icon: '◇' },
  { name: 'Analogy Agent',     color: '#88B5FC', role: 'CEO Deck · Analogies',   icon: '◆' },
  { name: 'Insight Agent',     color: '#10B981', role: 'Red Flags · Complexity', icon: '◉' },
];

// ─── Animated HBAR counter (ticks from 0 → target while agent works) ─────────

const AnimatedCounter = ({ target, running, color }: { target: number; running: boolean; color: string }) => {
  const [val, setVal] = useState(0);
  const rafRef = useRef<number | undefined>();

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (!running || !target) { setVal(0); return; }
    const t0 = Date.now();
    const dur = 7000; // slow dramatic count-up
    const tick = () => {
      const p = Math.min((Date.now() - t0) / dur, 1);
      setVal(target * (1 - Math.pow(1 - p, 2))); // ease-out quad
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, running]);

  return (
    <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 20, fontWeight: 700, color, display: 'block', lineHeight: 1.2 }}>
      {val.toFixed(3)} <span style={{ fontSize: 11, opacity: 0.6 }}>ℏ</span>
    </span>
  );
};

// ─── Constants ────────────────────────────────────────────────────────────────

const AGENT_COLOR: Record<string, string> = {
  'Code Reader Agent': '#8B5CF6',
  'Simplifier Agent':  '#38B2F6',
  'Analogy Agent':     '#88B5FC',
  'Insight Agent':     '#10B981',
};

const CATEGORY_COLOR: Record<string, string> = {
  frontend: '#38B2F6', backend: '#8B5CF6', database: '#88B5FC',
  ai: '#10B981', blockchain: '#6366F1', infrastructure: '#64748B',
  testing: '#34D399', tooling: '#A78BFA', auth: '#F59E0B', payments: '#10B981',
};

const SEVERITY_COLOR: Record<string, string> = {
  high: '#F87171', medium: '#FBBF24', low: '#38B2F6',
};

const EFFORT_COLOR: Record<string, string> = {
  low: '#10B981', medium: '#FBBF24', high: '#F87171',
};

// ─── Component ────────────────────────────────────────────────────────────────

const Analysis = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Input — pre-fill repo URL from ?repo= query param (passed by Landing)
  const [repoUrl, setRepoUrl]   = useState(() => searchParams.get('repo') || '');
  const [budget, setBudget]     = useState(1.5);

  // State machine
  const [phase, setPhase]       = useState<Phase>('idle');
  const [activeTab, setActiveTab] = useState<Tab>('architecture');

  // Live feed
  const [repoMeta, setRepoMeta]       = useState<RepoMeta | null>(null);
  const [agents, setAgents]           = useState<AgentStatus[]>([]);
  const [remainingBudget, setRemainingBudget] = useState(0);
  const [refundAmount, setRefundAmount]   = useState(0);
  const [refundTxId, setRefundTxId]       = useState('');
  const [errorMsg, setErrorMsg]           = useState('');

  // Results
  const [data, setData] = useState<AnalysisData>({});

  // Share link
  const [shareId, setShareId]         = useState('');
  const [shareCopied, setShareCopied] = useState(false);

  // Pulse animation for running state
  const [pulse, setPulse] = useState(true);
  useEffect(() => {
    if (phase !== 'analyzing') return;
    const id = setInterval(() => setPulse((p) => !p), 600);
    return () => clearInterval(id);
  }, [phase]);

  // Orchestrator phase label
  const workingCount = agents.filter((a) => a.status === 'working').length;
  const orchestratorStatus =
    workingCount > 1  ? 'PHASE 2 · PARALLEL DISPATCH' :
    workingCount === 1 ? 'PHASE 1 · BOOT SEQUENCE' :
    agents.length > 0  ? 'ALL AGENTS COMPLETE' :
    'INITIALIZING...';

  // ─── Start Analysis ─────────────────────────────────────────────────────────

  const startAnalysis = () => {
    const url = repoUrl.trim();
    if (!url) { setErrorMsg('Please enter a GitHub repo URL.'); return; }
    if (!url.includes('github.com')) { setErrorMsg('Only GitHub repos are supported right now.'); return; }

    setErrorMsg('');
    setData({});
    setAgents([]);
    setRepoMeta(null);
    setRefundAmount(0);
    setRefundTxId('');
    setShareId('');
    setShareCopied(false);
    setRemainingBudget(budget);
    setPhase('fetching');

    const apiUrl = 'http://localhost:3001/api/analyze?repo=' + encodeURIComponent(url) + '&budget=' + budget;
    const es = new EventSource(apiUrl);

    es.onmessage = (e) => {
      const event = JSON.parse(e.data);

      if (event.type === 'fetching_repo') {
        setPhase('fetching');
      }

      if (event.type === 'repo_fetched') {
        setRepoMeta(event.meta);
        setPhase('analyzing');
      }

      if (event.type === 'agent_start') {
        setAgents((prev) => [
          ...prev,
          { name: event.agent, key: '', status: 'working', payment: event.payment, txId: '', allocation: event.allocation },
        ]);
      }

      if (event.type === 'agent_complete') {
        setAgents((prev) =>
          prev.map((a) =>
            a.name === event.agent && a.status === 'working'
              ? { ...a, status: 'complete', txId: event.txId, payment: event.payment }
              : a
          )
        );
        setRemainingBudget(event.remainingBudget);
        setData((prev) => ({ ...prev, [event.key]: event.result }));
      }

      if (event.type === 'agent_error') {
        setAgents((prev) =>
          prev.map((a) => a.name === event.agent ? { ...a, status: 'error' } : a)
        );
      }

      if (event.type === 'analysis_complete') {
        setData(event.data);
      }

      if (event.type === 'report_saved') {
        setShareId(event.shareId);
      }

      if (event.type === 'refund') {
        setRefundAmount(event.amount);
        setRefundTxId(event.txId);
        setPhase('complete');
        es.close();
      }

      if (event.type === 'error') {
        setErrorMsg(event.message);
        setPhase('idle');
        es.close();
      }
    };

    es.onerror = () => {
      setErrorMsg('Could not connect to PayStream server. Make sure node server.js is running on port 3001.');
      setPhase('idle');
      es.close();
    };
  };

  const reset = () => {
    setPhase('idle');
    setData({});
    setAgents([]);
    setRepoMeta(null);
    setErrorMsg('');
    setRefundAmount(0);
    setRefundTxId('');
    setShareId('');
    setShareCopied(false);
  };

  const copyShareLink = () => {
    const url = window.location.origin + '/report/' + shareId;
    navigator.clipboard.writeText(url);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2500);
  };

  // ─── Tab availability ────────────────────────────────────────────────────────

  const tabAvailable = {
    architecture: !!data.codeReader,
    techstack:    !!data.codeReader,
    insights:     !!data.insight,
    ceodeck:      !!data.analogy,
    devdocs:      !!data.simplifier,
  };

  const TABS: { id: Tab; label: string; key: keyof typeof tabAvailable }[] = [
    { id: 'architecture', label: 'Architecture',  key: 'architecture' },
    { id: 'techstack',    label: 'Tech Stack',    key: 'techstack' },
    { id: 'insights',     label: 'Insights',      key: 'insights' },
    { id: 'ceodeck',      label: 'CEO Deck',       key: 'ceodeck' },
    { id: 'devdocs',      label: 'Dev Docs',       key: 'devdocs' },
  ];

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', background: '#020B18', color: '#E8F4FF', fontFamily: "'DM Sans', sans-serif", padding: '40px 20px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <header style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 10, color: 'rgba(136,181,252,0.3)', letterSpacing: 4, textTransform: 'uppercase', marginBottom: 12, fontFamily: "'JetBrains Mono',monospace" }}>
            ETHDenver 2026
          </div>
          <h1
            style={{ fontFamily: "'Orbitron', sans-serif", color: '#88B5FC', fontSize: 32, letterSpacing: 6, margin: '0 0 8px', cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            PAYSTREAM
          </h1>
          <p style={{ color: 'rgba(232,244,255,0.35)', fontSize: 13, margin: 0, fontFamily: "'JetBrains Mono',monospace" }}>Codebase Intelligence · 4 AI Agents · Real HBAR on Hedera</p>
        </header>

        {/* Error */}
        {errorMsg && (
          <div style={{ padding: '14px 18px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12, color: 'rgba(252,165,165,0.9)', fontSize: 13, marginBottom: 24, display: 'flex', gap: 10 }}>
            <span style={{ flexShrink: 0 }}>⚠</span>{errorMsg}
          </div>
        )}

        {/* ── IDLE: Input Form ─────────────────────────────────────────────── */}
        {phase === 'idle' && (
          <div style={{ border: '1px solid rgba(136,181,252,0.25)', borderRadius: 16, padding: 36, background: 'rgba(8,18,38,0.6)', marginBottom: 32, animation: 'fadeIn 0.4s ease', backdropFilter: 'blur(20px)' }}>

            <label style={{ color: '#88B5FC', fontSize: 10, fontWeight: 700, letterSpacing: 3, display: 'block', marginBottom: 10, textTransform: 'uppercase', fontFamily: "'JetBrains Mono',monospace" }}>
              GitHub Repository URL
            </label>
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && startAnalysis()}
              placeholder="https://github.com/owner/repo"
              style={{
                width: '100%', padding: '13px 16px',
                background: 'rgba(8,20,45,0.6)',
                border: '1px solid rgba(136,181,252,0.2)', borderRadius: 10, color: '#E8F4FF',
                fontFamily: "'JetBrains Mono', monospace", fontSize: 14,
                outline: 'none', boxSizing: 'border-box', marginBottom: 24,
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <label style={{ color: '#88B5FC', fontSize: 10, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', fontFamily: "'JetBrains Mono',monospace" }}>
                Budget
              </label>
              <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 18, fontWeight: 700, color: '#88B5FC' }}>
                {budget.toFixed(1)} <span style={{ fontSize: 11, opacity: 0.5 }}>HBAR</span>
              </span>
            </div>
            <input
              type="range" min={0.5} max={5} step={0.5} value={budget}
              onChange={(e) => setBudget(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#7E3FF2', marginBottom: 8 }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(232,244,255,0.18)', fontSize: 10, marginBottom: 28, fontFamily: "'JetBrains Mono',monospace" }}>
              <span>0.5</span><span>5.0</span>
            </div>

            <button
              onClick={startAnalysis}
              style={{
                width: '100%', padding: '15px 0',
                background: 'linear-gradient(135deg, #7E3FF2 0%, #4F46E5 100%)',
                color: '#fff',
                fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 15,
                border: 'none', borderRadius: 10, cursor: 'pointer', letterSpacing: 0.5,
                boxShadow: '0 0 40px rgba(126,63,242,0.4), inset 0 1px 0 rgba(255,255,255,0.12)',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 0 60px rgba(126,63,242,0.6)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 40px rgba(126,63,242,0.4)'; }}
            >
              ⬡ Can you explain this to my CEO?
            </button>

            <div style={{ marginTop: 20, display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              {['facebook/react', 'expressjs/express', 'vercel/next.js'].map((ex) => (
                <button
                  key={ex}
                  onClick={() => setRepoUrl('https://github.com/' + ex)}
                  style={{ padding: '5px 12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, color: 'rgba(232,244,255,0.25)', fontSize: 11, cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace", transition: 'all 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(136,181,252,0.3)'; e.currentTarget.style.color = '#88B5FC'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(232,244,255,0.25)'; }}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── FETCHING ─────────────────────────────────────────────────────── */}
        {phase === 'fetching' && (
          <div style={{ textAlign: 'center', padding: '80px 0', animation: 'fadeIn 0.3s ease' }}>
            <div style={{ fontSize: 32, marginBottom: 16, color: '#88B5FC', animation: 'spinIcon 1.5s linear infinite', display: 'inline-block' }}>⬡</div>
            <div style={{ color: '#88B5FC', fontFamily: "'Orbitron', sans-serif", fontSize: 12, letterSpacing: 4, marginBottom: 8 }}>
              FETCHING REPOSITORY...
            </div>
            <div style={{ color: 'rgba(232,244,255,0.3)', fontSize: 12, fontFamily: "'JetBrains Mono',monospace" }}>{repoUrl}</div>
          </div>
        )}

        {/* ── ANALYZING: Orchestrator View ─────────────────────────────────── */}
        {(phase === 'analyzing' || phase === 'complete') && (
          <>
            {/* ── ORCHESTRATOR MASTER BOX ──────────────────────────────────── */}
            <div style={{
              border: '1.5px solid rgba(136,181,252,0.35)',
              borderRadius: 14, padding: '20px 28px',
              background: 'linear-gradient(135deg, rgba(126,63,242,0.08) 0%, rgba(8,18,38,0.8) 70%)',
              marginBottom: 0, position: 'relative', overflow: 'hidden',
              animation: 'fadeIn 0.4s ease', backdropFilter: 'blur(20px)',
            }}>
              {/* Corner brackets */}
              <div style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderTop: '2px solid rgba(136,181,252,0.22)', borderRight: '2px solid rgba(136,181,252,0.22)', borderRadius: '0 4px 0 0' }} />
              <div style={{ position: 'absolute', bottom: 8, left: 8, width: 28, height: 28, borderBottom: '2px solid rgba(136,181,252,0.18)', borderLeft: '2px solid rgba(136,181,252,0.18)', borderRadius: '0 0 0 4px' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                {/* Left: identity + repo */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <span style={{ color: '#88B5FC', fontSize: 10, fontFamily: "'Orbitron', sans-serif", letterSpacing: 4, fontWeight: 700 }}>⬡ PAYSTREAM ORCHESTRATOR</span>
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%', display: 'inline-block',
                      background: phase === 'analyzing' ? '#10B981' : 'rgba(16,185,129,0.3)',
                      opacity: phase === 'analyzing' ? (pulse ? 1 : 0.15) : 1,
                      transition: 'opacity 0.3s',
                      boxShadow: phase === 'analyzing' ? '0 0 10px #10B981' : 'none',
                    }} />
                  </div>
                  {repoMeta && (
                    <>
                      <div style={{ color: 'rgba(232,244,255,0.9)', fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{repoMeta.repoName}</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ color: 'rgba(232,244,255,0.25)', fontSize: 11 }}>{repoMeta.fileCount} files ·</span>
                        {repoMeta.languages.slice(0, 4).map((lang) => (
                          <span key={lang} style={{ padding: '2px 8px', background: 'rgba(8,20,45,0.7)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 4, color: 'rgba(232,244,255,0.3)', fontSize: 10 }}>{lang}</span>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Right: budget + phase status */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 28, color: '#ffaa00', fontWeight: 700, letterSpacing: 1 }}>
                    {remainingBudget.toFixed(3)} <span style={{ fontSize: 14, opacity: 0.6 }}>ℏ</span>
                  </div>
                  <div style={{ color: 'rgba(232,244,255,0.25)', fontSize: 10, marginTop: 2, letterSpacing: 1, fontFamily: "'JetBrains Mono',monospace" }}>REMAINING BUDGET</div>
                  <div style={{ marginTop: 10, padding: '5px 14px', background: 'rgba(136,181,252,0.08)', border: '1px solid rgba(136,181,252,0.2)', borderRadius: 4, display: 'inline-block' }}>
                    <span style={{ color: '#88B5FC', fontSize: 9, fontWeight: 700, letterSpacing: 2, fontFamily: "'JetBrains Mono',monospace" }}>{orchestratorStatus}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── SIGNAL WIRES: stem → bus → drops ─────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none' }}>
              {/* Vertical stem from orchestrator */}
              <div style={{ width: 2, height: 20, background: 'linear-gradient(to bottom, rgba(136,181,252,0.73), transparent)' }} />
              {/* Horizontal bus */}
              <div style={{ width: '92%', height: 2, background: 'linear-gradient(to right, transparent 2%, rgba(136,181,252,0.1) 15%, rgba(136,181,252,0.2) 50%, rgba(136,181,252,0.1) 85%, transparent 98%)' }} />
            </div>

            {/* ── AGENT SLAVE CARDS ────────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 28 }}>
              {AGENT_DEFS.map((def) => {
                const agent   = agents.find((a) => a.name === def.name);
                const status  = agent?.status || 'pending';
                const color   = def.color;
                const isWork  = status === 'working';
                const isDone  = status === 'complete';
                const isErr   = status === 'error';

                return (
                  <div key={def.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {/* Drop wire from bus */}
                    <div style={{
                      width: 2, height: 22,
                      background: isWork ? color : isDone ? color + '55' : 'rgba(255,255,255,0.06)',
                      boxShadow: isWork ? `0 0 10px ${color}99` : 'none',
                      position: 'relative',
                      transition: 'background 0.6s, box-shadow 0.6s',
                    }}>
                      {/* Animated signal pulse */}
                      {isWork && (
                        <div style={{
                          position: 'absolute', left: '50%', top: 0,
                          width: 8, height: 8, borderRadius: '50%',
                          background: color,
                          transform: 'translateX(-50%)',
                          animation: 'signalDrop 1.1s ease-in infinite',
                          boxShadow: `0 0 8px ${color}`,
                        }} />
                      )}
                    </div>

                    {/* Arrowhead tip */}
                    <div style={{
                      width: 0, height: 0,
                      borderLeft: '5px solid transparent',
                      borderRight: '5px solid transparent',
                      borderTop: `7px solid ${isWork ? color : isDone ? color + '55' : 'rgba(255,255,255,0.06)'}`,
                      transition: 'border-top-color 0.6s',
                    }} />

                    {/* ── Agent Card ── */}
                    <div style={{
                      width: '100%', marginTop: 6,
                      background: 'rgba(8,18,38,0.7)',
                      border: `1.5px solid ${isWork ? color : isDone ? color + '44' : isErr ? '#ff444466' : 'rgba(255,255,255,0.06)'}`,
                      borderRadius: 10, padding: '14px 12px',
                      boxShadow: isWork ? `0 0 24px ${color}22, inset 0 0 40px ${color}06` : 'none',
                      transition: 'border-color 0.6s, box-shadow 0.6s',
                      minHeight: 178, display: 'flex', flexDirection: 'column', gap: 7,
                      animation: isWork ? 'workingCard 2.5s ease-in-out infinite' : 'fadeIn 0.5s ease',
                    }}>
                      {/* Status icon + short name */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span style={{
                          fontSize: 13, color: isDone ? color : isWork ? color : isErr ? '#F87171' : 'rgba(136,181,252,0.1)',
                          display: 'inline-block',
                          animation: isWork ? 'spinIcon 2s linear infinite' : undefined,
                        }}>
                          {isDone ? '✓' : isErr ? '✕' : isWork ? '⟳' : '○'}
                        </span>
                        <span style={{ fontSize: 9, fontWeight: 700, color: isWork || isDone ? color : 'rgba(232,244,255,0.1)', letterSpacing: 1.2, textTransform: 'uppercase' }}>
                          {def.name.replace(' Agent', '')}
                        </span>
                      </div>

                      <div style={{ fontSize: 9, color: isWork || isDone ? 'rgba(232,244,255,0.35)' : 'rgba(232,244,255,0.08)', lineHeight: 1.5 }}>
                        {def.role}
                      </div>

                      {/* Allocation badge */}
                      {agent ? (
                        <div style={{ fontSize: 9, color: color, padding: '2px 8px', background: color + '11', border: '1px solid ' + color + '33', borderRadius: 4, display: 'inline-block', width: 'fit-content' }}>
                          {agent.allocation}% ALLOC
                        </div>
                      ) : (
                        <div style={{ fontSize: 9, color: 'rgba(232,244,255,0.1)', padding: '2px 8px', background: 'rgba(8,14,30,0.5)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 4, display: 'inline-block', width: 'fit-content' }}>
                          QUEUED
                        </div>
                      )}

                      {/* Token counter — grows as agent works */}
                      <div style={{ borderTop: `1px solid ${isWork || isDone ? color + '22' : 'rgba(255,255,255,0.04)'}`, marginTop: 'auto', paddingTop: 10 }}>
                        {status === 'pending' && (
                          <span style={{ color: 'rgba(255,255,255,0.06)', fontSize: 12, fontFamily: "'Orbitron', sans-serif" }}>— · —  ℏ</span>
                        )}
                        {isWork && agent && (
                          <AnimatedCounter target={agent.payment} running={true} color={color} />
                        )}
                        {isDone && agent && (
                          <>
                            <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 18, fontWeight: 700, color, display: 'block' }}>
                              {agent.payment.toFixed(3)} <span style={{ fontSize: 10, opacity: 0.6 }}>ℏ</span>
                            </span>
                            {agent.txId && (
                              <a
                                href={`https://hashscan.io/testnet/transaction/${agent.txId}`}
                                target="_blank" rel="noopener noreferrer"
                                style={{ color: '#38B2F6', fontSize: 10, textDecoration: 'none', display: 'block', marginTop: 5, letterSpacing: 0.5 }}
                              >
                                view tx ↗
                              </a>
                            )}
                          </>
                        )}
                        {isErr && (
                          <span style={{ color: '#F87171', fontSize: 11 }}>agent failed</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Refund banner */}
            {phase === 'complete' && refundAmount > 0 && (
              <div style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.25)', padding: '18px 24px', borderRadius: 14, marginBottom: 28, animation: 'fadeIn 0.5s ease', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34D399', fontSize: 18, flexShrink: 0 }}>✓</div>
                <div>
                  <div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 14, color: '#34D399', letterSpacing: 1, marginBottom: 4 }}>REFUNDED {refundAmount.toFixed(3)} HBAR</div>
                  {refundTxId && (
                    <a href={'https://hashscan.io/testnet/transaction/' + refundTxId} target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(52,211,153,0.5)', fontSize: 12, textDecoration: 'none', fontFamily: "'JetBrains Mono',monospace" }}>
                      view refund on HashScan ↗
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* ── Share with CEO banner ─────────────────────────────────── */}
            {phase === 'complete' && shareId && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(126,63,242,0.12) 0%, rgba(56,178,246,0.08) 100%)',
                border: '1px solid rgba(136,181,252,0.3)',
                borderRadius: 16, padding: '22px 28px', marginBottom: 28,
                animation: 'fadeIn 0.5s ease', backdropFilter: 'blur(20px)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ fontSize: 28 }}>⬡</div>
                  <div>
                    <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 13, fontWeight: 700, color: '#88B5FC', letterSpacing: 1, marginBottom: 4 }}>
                      REPORT READY TO SHARE
                    </div>
                    <div style={{ color: 'rgba(232,244,255,0.45)', fontSize: 12, fontFamily: "'JetBrains Mono',monospace" }}>
                      {window.location.origin}/report/{shareId}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={copyShareLink}
                    style={{
                      padding: '10px 22px',
                      background: shareCopied ? 'rgba(16,185,129,0.15)' : 'linear-gradient(135deg, #7E3FF2 0%, #4F46E5 100%)',
                      border: shareCopied ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(126,63,242,0.5)',
                      borderRadius: 9, color: shareCopied ? '#34D399' : '#fff',
                      fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 13,
                      cursor: 'pointer', transition: 'all 0.3s', letterSpacing: 0.3,
                      boxShadow: shareCopied ? 'none' : '0 0 24px rgba(126,63,242,0.35)',
                    }}
                  >
                    {shareCopied ? '✓ Copied!' : '⎘ Copy Link'}
                  </button>
                  <button
                    onClick={() => window.open('/report/' + shareId, '_blank')}
                    style={{
                      padding: '10px 22px',
                      background: 'transparent',
                      border: '1px solid rgba(136,181,252,0.25)',
                      borderRadius: 9, color: '#88B5FC',
                      fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 13,
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(136,181,252,0.07)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    Preview Report ↗
                  </button>
                </div>
              </div>
            )}

            {/* ── Results Tabs ───────────────────────────────────────────── */}
            {phase === 'complete' && (
              <>
                {/* Tab nav */}
                <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap', padding: 4, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, width: 'fit-content' }}>
                  {TABS.map((tab) => {
                    const available = tabAvailable[tab.key];
                    const active = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => available && setActiveTab(tab.id)}
                        style={{
                          padding: '9px 18px', background: active ? 'rgba(136,181,252,0.1)' : 'transparent',
                          border: active ? '1px solid rgba(136,181,252,0.2)' : '1px solid transparent',
                          borderRadius: 9,
                          color: active ? '#88B5FC' : available ? 'rgba(232,244,255,0.38)' : 'rgba(232,244,255,0.12)',
                          fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                          fontWeight: active ? 700 : 600, cursor: available ? 'pointer' : 'default',
                          letterSpacing: 0.3, transition: 'all 0.2s',
                        }}
                      >
                        {tab.label}
                        {!available && <span style={{ marginLeft: 6, fontSize: 9, color: 'rgba(232,244,255,0.15)' }}>⟳</span>}
                      </button>
                    );
                  })}
                </div>

                {/* ── Architecture Tab ─────────────────────────────────── */}
                {activeTab === 'architecture' && data.codeReader && (
                  <div style={{ animation: 'fadeIn 0.4s ease' }}>
                    <SectionLabel>Architecture Map</SectionLabel>
                    <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, overflow: 'hidden', marginBottom: 24 }}>
                      <MermaidDiagram chart={data.codeReader.architectureMap.mermaid} />
                    </div>
                    <p style={{ color: 'rgba(232,244,255,0.45)', fontSize: 13, lineHeight: 1.7, marginBottom: 28, padding: '16px 20px', background: 'rgba(8,18,38,0.6)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
                      {data.codeReader.architectureMap.description}
                    </p>

                    <SectionLabel>Modules</SectionLabel>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12, marginBottom: 24 }}>
                      {(data.codeReader.modules || []).map((mod, i) => (
                        <div key={i} style={{ background: 'rgba(8,18,38,0.6)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '16px 18px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <code style={{ color: '#88B5FC', fontSize: 11 }}>{mod.path}</code>
                            <span style={{ fontSize: 10, padding: '2px 8px', background: 'rgba(8,20,45,0.7)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 4, color: 'rgba(232,244,255,0.25)' }}>
                              {mod.type}
                            </span>
                          </div>
                          <p style={{ color: 'rgba(232,244,255,0.45)', fontSize: 12, margin: 0, lineHeight: 1.6 }}>{mod.purpose}</p>
                        </div>
                      ))}
                    </div>

                    <SectionLabel>Dependencies</SectionLabel>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {(data.codeReader.dependencies || []).map((dep, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'rgba(8,18,38,0.6)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
                          <span style={{ fontWeight: 700, fontSize: 13, color: 'rgba(232,244,255,0.9)', minWidth: 130 }}>{dep.name}</span>
                          <span style={{ flex: 1, fontSize: 12, color: 'rgba(232,244,255,0.3)' }}>{dep.purpose}</span>
                          <span style={{ fontSize: 10, padding: '2px 10px', borderRadius: 4, background: SEVERITY_COLOR[dep.risk] + '22', color: SEVERITY_COLOR[dep.risk], border: '1px solid ' + SEVERITY_COLOR[dep.risk] + '44', whiteSpace: 'nowrap' }}>
                            {dep.risk} risk
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Tech Stack Tab ───────────────────────────────────── */}
                {activeTab === 'techstack' && data.codeReader && (
                  <div style={{ animation: 'fadeIn 0.4s ease' }}>
                    <SectionLabel>Tech Stack</SectionLabel>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14, marginBottom: 32 }}>
                      {(data.codeReader.techStack || []).map((tech, i) => {
                        const catColor = CATEGORY_COLOR[tech.category] || 'rgba(232,244,255,0.4)';
                        const analogy = data.analogy?.techAnalogies?.find((a) => a.tech.toLowerCase() === tech.name.toLowerCase());
                        return (
                          <div key={i} style={{ background: 'rgba(8,18,38,0.6)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '20px 20px', borderTop: '2px solid ' + catColor + '66' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: 15, color: 'rgba(232,244,255,0.9)' }}>{tech.name}</div>
                                {tech.version && <div style={{ fontSize: 10, color: 'rgba(232,244,255,0.2)', marginTop: 2 }}>v{tech.version}</div>}
                              </div>
                              <span style={{ fontSize: 10, padding: '3px 10px', background: catColor + '1a', border: '1px solid ' + catColor + '44', borderRadius: 4, color: catColor, whiteSpace: 'nowrap' }}>
                                {tech.category}
                              </span>
                            </div>
                            <p style={{ color: 'rgba(232,244,255,0.3)', fontSize: 12, margin: '0 0 10px', lineHeight: 1.6 }}>{tech.role}</p>
                            {analogy && (
                              <div style={{ padding: '10px 14px', background: 'rgba(8,20,45,0.7)', borderRadius: 6, borderLeft: '2px solid ' + catColor + '88' }}>
                                <div style={{ fontSize: 10, color: catColor, letterSpacing: 1, marginBottom: 4, fontWeight: 700 }}>ANALOGY</div>
                                <div style={{ fontSize: 12, color: 'rgba(232,244,255,0.5)', lineHeight: 1.5, fontStyle: 'italic' }}>"{analogy.analogy}"</div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── Insights Tab ─────────────────────────────────────── */}
                {activeTab === 'insights' && data.insight && (
                  <div style={{ animation: 'fadeIn 0.4s ease' }}>

                    {/* Complexity Score */}
                    <SectionLabel>Complexity Score</SectionLabel>
                    {(() => {
                      const s = data.insight.complexityScore;
                      const pct = (s.score / 10) * 100;
                      const col = s.score <= 3 ? '#10B981' : s.score <= 6 ? '#FBBF24' : '#F87171';
                      return (
                        <div style={{ background: 'rgba(8,18,38,0.6)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 24, marginBottom: 24 }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 16 }}>
                            <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 56, color: col, fontWeight: 700, lineHeight: 1 }}>{s.score}</div>
                            <div>
                              <div style={{ fontSize: 10, color: 'rgba(232,244,255,0.2)', letterSpacing: 2, textTransform: 'uppercase' }}>out of 10</div>
                              <div style={{ fontSize: 14, color: col, fontWeight: 700, marginTop: 4 }}>{s.label}</div>
                            </div>
                          </div>
                          <div style={{ height: 6, background: 'rgba(8,20,45,0.7)', borderRadius: 3, marginBottom: 16, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: pct + '%', background: col, borderRadius: 3, transition: 'width 1s ease' }} />
                          </div>
                          <p style={{ color: 'rgba(232,244,255,0.45)', fontSize: 13, margin: '0 0 12px', lineHeight: 1.6 }}>{s.reasoning}</p>
                          {s.cleanParts && (
                            <div style={{ fontSize: 12, color: '#10B981', marginBottom: 6 }}>✓ {s.cleanParts}</div>
                          )}
                          {s.overEngineered && (
                            <div style={{ fontSize: 12, color: '#FBBF24' }}>⚠ {s.overEngineered}</div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Red Flags */}
                    <SectionLabel>Red Flags</SectionLabel>
                    <div style={{ marginBottom: 28 }}>
                      {data.insight.redFlags.length === 0 ? (
                        <div style={{ color: '#10B981', fontSize: 13, padding: '16px 20px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8 }}>
                          ✓ No significant issues found.
                        </div>
                      ) : (
                        (data.insight.redFlags || []).map((flag, i) => (
                          <div key={i} style={{ padding: '14px 18px', background: 'rgba(8,18,38,0.6)', border: '1px solid rgba(255,255,255,0.06)', borderLeft: '3px solid ' + SEVERITY_COLOR[flag.severity], borderRadius: 8, marginBottom: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                              <span style={{ fontSize: 10, padding: '2px 10px', background: SEVERITY_COLOR[flag.severity] + '22', color: SEVERITY_COLOR[flag.severity], borderRadius: 4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                                {flag.severity}
                              </span>
                              <code style={{ fontSize: 11, color: 'rgba(232,244,255,0.2)' }}>{flag.location}</code>
                            </div>
                            <div style={{ color: 'rgba(232,244,255,0.75)', fontSize: 13, marginBottom: 6, lineHeight: 1.5 }}>{flag.issue}</div>
                            <div style={{ color: 'rgba(232,244,255,0.28)', fontSize: 11 }}>→ {flag.suggestion}</div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Scalability */}
                    <SectionLabel>Scalability</SectionLabel>
                    <div style={{ background: 'rgba(8,18,38,0.6)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 24, marginBottom: 24 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                        <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 12, fontWeight: 700, color: data.insight.scalability.canHandle10x ? '#10B981' : '#F87171' }}>
                          {data.insight.scalability.canHandle10x ? '✓ CAN HANDLE 10x' : '✗ CANNOT HANDLE 10x'}
                        </span>
                      </div>
                      <p style={{ color: 'rgba(232,244,255,0.45)', fontSize: 13, margin: '0 0 12px', lineHeight: 1.6 }}>{data.insight.scalability.assessment}</p>
                      <div style={{ fontSize: 12, color: '#FBBF24' }}>⚠ Bottleneck: {data.insight.scalability.bottleneck}</div>
                    </div>

                    {/* Tech Debt */}
                    <SectionLabel>Tech Debt</SectionLabel>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                      {(data.insight.techDebt || []).map((d, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'rgba(8,18,38,0.6)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8 }}>
                          <span style={{ flex: 1, fontSize: 13, color: 'rgba(232,244,255,0.75)' }}>{d.item}</span>
                          <span style={{ fontSize: 10, padding: '2px 8px', background: EFFORT_COLOR[d.effort] + '1a', color: EFFORT_COLOR[d.effort], border: '1px solid ' + EFFORT_COLOR[d.effort] + '44', borderRadius: 4 }}>
                            effort: {d.effort}
                          </span>
                          <span style={{ fontSize: 10, padding: '2px 8px', background: EFFORT_COLOR[d.impact] + '1a', color: EFFORT_COLOR[d.impact], border: '1px solid ' + EFFORT_COLOR[d.impact] + '44', borderRadius: 4 }}>
                            impact: {d.impact}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Rebuild suggestion */}
                    <SectionLabel>If You Were to Rebuild This</SectionLabel>
                    <div style={{ padding: '20px 24px', background: 'rgba(8,18,38,0.6)', border: '1px solid rgba(255,255,255,0.06)', borderLeft: '3px solid #8B5CF6', borderRadius: 8 }}>
                      <p style={{ color: 'rgba(232,244,255,0.55)', fontSize: 13, margin: 0, lineHeight: 1.8 }}>{data.insight.rebuildSuggestion}</p>
                    </div>
                  </div>
                )}

                {/* ── CEO Deck Tab ─────────────────────────────────────── */}
                {activeTab === 'ceodeck' && data.analogy && (
                  <div style={{ animation: 'fadeIn 0.4s ease' }}>
                    <SectionLabel>CEO Deck — 5 Slides</SectionLabel>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
                      {(data.analogy.ceoSlides || []).map((slide, i) => {
                        const slideColors = ['#8B5CF6', '#38B2F6', '#FBBF24', '#10B981', '#F472B6'];
                        const col = slideColors[i % slideColors.length];
                        return (
                          <div key={i} style={{ background: 'rgba(8,18,38,0.6)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '24px 28px', borderTop: '2px solid ' + col }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 14 }}>
                              <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 11, color: col, letterSpacing: 2 }}>
                                SLIDE {slide.slideNumber || i + 1}
                              </span>
                              <h3 style={{ color: 'rgba(232,244,255,0.9)', fontFamily: "'Orbitron', sans-serif", fontSize: 16, fontWeight: 700, margin: 0, letterSpacing: 1 }}>
                                {slide.title}
                              </h3>
                            </div>
                            <div style={{ color: 'rgba(232,244,255,0.55)', fontSize: 13, lineHeight: 1.8, marginBottom: 14, whiteSpace: 'pre-wrap' }}>
                              {slide.content}
                            </div>
                            <div style={{ padding: '10px 16px', background: col + '11', border: '1px solid ' + col + '33', borderRadius: 6 }}>
                              <span style={{ fontSize: 10, color: col, letterSpacing: 1, fontWeight: 700 }}>SPEAKER NOTE  </span>
                              <span style={{ fontSize: 12, color: 'rgba(232,244,255,0.4)', fontStyle: 'italic' }}>{slide.speakerNote}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── Dev Docs Tab ─────────────────────────────────────── */}
                {activeTab === 'devdocs' && data.simplifier && (
                  <div style={{ animation: 'fadeIn 0.4s ease' }}>

                    {/* Code Flow */}
                    <SectionLabel>Code Flow Walkthrough</SectionLabel>
                    <div style={{ padding: '20px 24px', background: 'rgba(8,18,38,0.6)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, marginBottom: 28 }}>
                      <p style={{ color: 'rgba(232,244,255,0.55)', fontSize: 13, margin: 0, lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>
                        {data.simplifier.codeFlow}
                      </p>
                    </div>

                    {/* Onboarding Doc */}
                    <SectionLabel>Onboarding Doc for New Developers</SectionLabel>
                    <div style={{ padding: '20px 24px', background: 'rgba(8,18,38,0.6)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, marginBottom: 28 }}>
                      <pre style={{ color: 'rgba(232,244,255,0.55)', fontSize: 12, margin: 0, lineHeight: 1.8, whiteSpace: 'pre-wrap', fontFamily: "'JetBrains Mono', monospace", overflowX: 'auto' }}>
                        {data.simplifier.onboardingDoc}
                      </pre>
                      <button
                        onClick={() => navigator.clipboard.writeText(data.simplifier!.onboardingDoc)}
                        style={{ marginTop: 14, padding: '7px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, color: 'rgba(232,244,255,0.25)', fontSize: 11, cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace", transition: 'all 0.2s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(136,181,252,0.3)'; e.currentTarget.style.color = '#88B5FC'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(232,244,255,0.25)'; }}
                      >
                        copy markdown
                      </button>
                    </div>

                    {/* Glossary */}
                    <SectionLabel>Jargon Glossary</SectionLabel>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 10 }}>
                      {(data.simplifier.glossary || []).map((g, i) => (
                        <div key={i} style={{ padding: '14px 18px', background: 'rgba(8,18,38,0.6)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8 }}>
                          <div style={{ color: '#88B5FC', fontWeight: 700, fontSize: 13, marginBottom: 6 }}>{g.term}</div>
                          <div style={{ color: 'rgba(232,244,255,0.3)', fontSize: 12, lineHeight: 1.6 }}>{g.plain}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bottom CTAs */}
                <div style={{ display: 'flex', gap: 10, marginTop: 40, flexWrap: 'wrap' }}>
                  <button
                    onClick={reset}
                    style={{ flex: 1, minWidth: 200, padding: '12px 0', background: 'transparent', color: '#88B5FC', border: '1px solid rgba(136,181,252,0.3)', borderRadius: 8, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 13, cursor: 'pointer', letterSpacing: 2, transition: 'all 0.2s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(136,181,252,0.06)'; e.currentTarget.style.borderColor = 'rgba(136,181,252,0.5)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(136,181,252,0.3)'; }}
                  >
                    ANALYZE ANOTHER REPO
                  </button>
                  {repoMeta && (
                    <a
                      href={'https://github.com/' + repoMeta.repoName}
                      target="_blank" rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, minWidth: 200, padding: '12px 0', background: 'transparent', color: 'rgba(232,244,255,0.25)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: 13, textDecoration: 'none', letterSpacing: 1, transition: 'all 0.2s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(232,244,255,0.6)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(232,244,255,0.25)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                    >
                      view on github ↗
                    </a>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=JetBrains+Mono:wght@400;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeIn    { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes signalDrop {
          0%   { top: -4px;  opacity: 0;   transform: translateX(-50%) scale(1.2); }
          10%  { opacity: 1; }
          80%  { opacity: 0.9; }
          100% { top: 24px;  opacity: 0;   transform: translateX(-50%) scale(0.5); }
        }
        @keyframes workingCard {
          0%, 100% { transform: translateY(0px);  }
          50%       { transform: translateY(-2px); }
        }
        @keyframes spinIcon {
          from { transform: rotate(0deg);   }
          to   { transform: rotate(360deg); }
        }
        input[type="text"]:focus, textarea:focus {
          box-shadow: 0 0 0 3px rgba(136,181,252,0.12);
          border-color: rgba(136,181,252,0.4) !important;
          outline: none;
        }
      `}</style>
    </div>
  );
};

// ─── Small helper component ───────────────────────────────────────────────────

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div style={{ color: 'rgba(136,181,252,0.6)', fontSize: 10, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 14, marginTop: 4, fontFamily: "'JetBrains Mono',monospace" }}>
    {children}
  </div>
);

export default Analysis;
