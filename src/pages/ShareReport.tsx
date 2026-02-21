import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// ─── Types (mirrors Analysis.tsx) ─────────────────────────────────────────────

interface CEOSlide    { slideNumber: number; title: string; content: string; speakerNote: string }
interface TechAnalogy { tech: string; analogy: string; what: string }
interface RedFlag     { severity: string; issue: string; location: string; suggestion: string }
interface TechItem    { name: string; version?: string; role: string; category: string }

interface ReportData {
  repoName: string;
  repoUrl:  string;
  meta:     { fileCount: number; languages: string[] };
  createdAt: string;
  data: {
    codeReader?: {
      techStack: TechItem[];
      architectureMap: { description: string };
    };
    analogy?: {
      techAnalogies: TechAnalogy[];
      ceoSlides: CEOSlide[];
    };
    insight?: {
      complexityScore: { score: number; label: string; reasoning: string };
      redFlags: RedFlag[];
      scalability: { canHandle10x: boolean; bottleneck: string; assessment: string };
      rebuildSuggestion: string;
    };
    simplifier?: {
      codeFlow: string;
    };
  };
}

const SEVERITY_COLOR: Record<string, string> = {
  high: '#F87171', medium: '#FBBF24', low: '#38B2F6',
};

const CATEGORY_COLOR: Record<string, string> = {
  frontend: '#38B2F6', backend: '#8B5CF6', database: '#88B5FC',
  ai: '#10B981', blockchain: '#6366F1', infrastructure: '#64748B',
  testing: '#34D399', tooling: '#A78BFA', auth: '#F59E0B', payments: '#10B981',
};

const SLIDE_COLORS = ['#8B5CF6', '#38B2F6', '#FBBF24', '#10B981', '#F472B6'];

// ─── Component ────────────────────────────────────────────────────────────────

const ShareReport = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const navigate    = useNavigate();

  const [report, setReport]   = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [copied, setCopied]   = useState(false);

  useEffect(() => {
    if (!shareId) { setError('No report ID provided.'); setLoading(false); return; }
    fetch('http://localhost:3001/api/report/' + shareId)
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 404 ? 'Report not found or expired.' : 'Failed to load report.');
        return r.json();
      })
      .then((d) => { setReport(d); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, [shareId]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const formattedDate = report?.createdAt
    ? new Date(report.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#020B18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20, fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ fontSize: 36, color: '#88B5FC', animation: 'spinIcon 1.5s linear infinite' }}>⬡</div>
      <div style={{ color: 'rgba(232,244,255,0.4)', fontFamily: "'JetBrains Mono',monospace", fontSize: 12, letterSpacing: 3 }}>LOADING REPORT...</div>
      <style>{`@keyframes spinIcon { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error || !report) return (
    <div style={{ minHeight: '100vh', background: '#020B18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20, fontFamily: "'DM Sans',sans-serif", padding: 40, textAlign: 'center' }}>
      <div style={{ fontSize: 40, color: '#F87171' }}>⊘</div>
      <div style={{ color: 'rgba(232,244,255,0.7)', fontSize: 16 }}>{error || 'Report not found.'}</div>
      <div style={{ color: 'rgba(232,244,255,0.25)', fontSize: 13 }}>Reports expire after 30 days.</div>
      <button onClick={() => navigate('/analyze')} style={{ marginTop: 10, padding: '12px 28px', background: 'linear-gradient(135deg, #7E3FF2, #4F46E5)', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
        Analyze a New Repo →
      </button>
    </div>
  );

  const { data, repoName, repoUrl, meta } = report;
  const complexityCol = !data.insight ? '#88B5FC'
    : data.insight.complexityScore.score <= 3 ? '#10B981'
    : data.insight.complexityScore.score <= 6 ? '#FBBF24'
    : '#F87171';

  // ── Report ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#020B18', color: '#E8F4FF', fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Top bar ── */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backdropFilter: 'blur(20px)', background: 'rgba(2,11,24,0.85)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span
            style={{ fontFamily: "'Orbitron',sans-serif", color: '#88B5FC', fontSize: 16, letterSpacing: 4, cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >⬡ PAYSTREAM</span>
          <span style={{ color: 'rgba(255,255,255,0.08)' }}>|</span>
          <span style={{ color: 'rgba(232,244,255,0.35)', fontSize: 12, fontFamily: "'JetBrains Mono',monospace" }}>Codebase Intelligence Report</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={copyLink}
            style={{ padding: '8px 18px', background: copied ? 'rgba(16,185,129,0.1)' : 'rgba(136,181,252,0.08)', border: `1px solid ${copied ? 'rgba(16,185,129,0.35)' : 'rgba(136,181,252,0.25)'}`, borderRadius: 8, color: copied ? '#34D399' : '#88B5FC', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s' }}
          >
            {copied ? '✓ Copied!' : '⎘ Copy Link'}
          </button>
          <button
            onClick={() => navigate('/analyze')}
            style={{ padding: '8px 18px', background: 'linear-gradient(135deg, #7E3FF2, #4F46E5)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            Analyze Your Repo →
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '52px 24px 80px' }}>

        {/* ── Hero ── */}
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ fontSize: 10, color: 'rgba(136,181,252,0.35)', letterSpacing: 4, textTransform: 'uppercase', marginBottom: 14, fontFamily: "'JetBrains Mono',monospace" }}>
            Codebase Intelligence · Powered by PayStream
          </div>
          <h1 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 36, fontWeight: 900, color: '#E8F4FF', margin: '0 0 14px', letterSpacing: 2 }}>
            {repoName}
          </h1>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 18 }}>
            <span style={{ padding: '4px 14px', background: 'rgba(136,181,252,0.07)', border: '1px solid rgba(136,181,252,0.18)', borderRadius: 20, color: 'rgba(232,244,255,0.45)', fontSize: 12, fontFamily: "'JetBrains Mono',monospace" }}>
              {meta.fileCount} files analyzed
            </span>
            {meta.languages?.slice(0, 4).map((l) => (
              <span key={l} style={{ padding: '4px 14px', background: 'rgba(136,181,252,0.07)', border: '1px solid rgba(136,181,252,0.18)', borderRadius: 20, color: 'rgba(232,244,255,0.45)', fontSize: 12, fontFamily: "'JetBrains Mono',monospace" }}>{l}</span>
            ))}
            <span style={{ padding: '4px 14px', background: 'rgba(136,181,252,0.07)', border: '1px solid rgba(136,181,252,0.18)', borderRadius: 20, color: 'rgba(232,244,255,0.35)', fontSize: 12, fontFamily: "'JetBrains Mono',monospace" }}>
              {formattedDate}
            </span>
          </div>
          {repoUrl && (
            <a href={repoUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(136,181,252,0.4)', fontSize: 13, textDecoration: 'none', fontFamily: "'JetBrains Mono',monospace" }}>
              {repoUrl} ↗
            </a>
          )}
        </div>

        {/* ── Summary stats bar ── */}
        {data.insight && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 52 }}>
            {/* Complexity */}
            <div style={{ background: 'rgba(8,18,38,0.7)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '20px 22px', borderTop: `2px solid ${complexityCol}` }}>
              <div style={{ fontSize: 10, color: 'rgba(232,244,255,0.3)', letterSpacing: 2, marginBottom: 8, fontFamily: "'JetBrains Mono',monospace" }}>COMPLEXITY</div>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 36, fontWeight: 700, color: complexityCol, lineHeight: 1 }}>{data.insight.complexityScore.score}<span style={{ fontSize: 14, opacity: 0.5 }}>/10</span></div>
              <div style={{ fontSize: 11, color: 'rgba(232,244,255,0.35)', marginTop: 6 }}>{data.insight.complexityScore.label}</div>
            </div>
            {/* Scalability */}
            <div style={{ background: 'rgba(8,18,38,0.7)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '20px 22px', borderTop: `2px solid ${data.insight.scalability.canHandle10x ? '#10B981' : '#F87171'}` }}>
              <div style={{ fontSize: 10, color: 'rgba(232,244,255,0.3)', letterSpacing: 2, marginBottom: 8, fontFamily: "'JetBrains Mono',monospace" }}>SCALES 10x?</div>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 22, fontWeight: 700, color: data.insight.scalability.canHandle10x ? '#10B981' : '#F87171', lineHeight: 1.2 }}>
                {data.insight.scalability.canHandle10x ? '✓ YES' : '✗ NO'}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(232,244,255,0.35)', marginTop: 6, lineHeight: 1.5 }}>Bottleneck: {data.insight.scalability.bottleneck}</div>
            </div>
            {/* Red Flags */}
            <div style={{ background: 'rgba(8,18,38,0.7)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '20px 22px', borderTop: '2px solid #FBBF24' }}>
              <div style={{ fontSize: 10, color: 'rgba(232,244,255,0.3)', letterSpacing: 2, marginBottom: 8, fontFamily: "'JetBrains Mono',monospace" }}>ISSUES FOUND</div>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 36, fontWeight: 700, color: '#FBBF24', lineHeight: 1 }}>{data.insight.redFlags.length}</div>
              <div style={{ fontSize: 11, color: 'rgba(232,244,255,0.35)', marginTop: 6 }}>
                {data.insight.redFlags.filter(f => f.severity === 'high').length} high · {data.insight.redFlags.filter(f => f.severity === 'medium').length} medium
              </div>
            </div>
          </div>
        )}

        {/* ── CEO Deck ── */}
        {data.analogy?.ceoSlides?.length ? (
          <section style={{ marginBottom: 56 }}>
            <SectionHeader label="CEO DECK" subtitle="5-slide executive summary" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {data.analogy.ceoSlides.map((slide, i) => {
                const col = SLIDE_COLORS[i % SLIDE_COLORS.length];
                return (
                  <div key={i} style={{ background: 'rgba(8,18,38,0.7)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '28px 32px', borderLeft: `3px solid ${col}` }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 16 }}>
                      <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 10, color: col, letterSpacing: 3, opacity: 0.8 }}>SLIDE {slide.slideNumber || i + 1}</span>
                      <h2 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 20, fontWeight: 700, color: 'rgba(232,244,255,0.9)', margin: 0, letterSpacing: 0.5 }}>{slide.title}</h2>
                    </div>
                    <p style={{ color: 'rgba(232,244,255,0.65)', fontSize: 14, lineHeight: 1.85, margin: '0 0 18px', whiteSpace: 'pre-wrap' }}>{slide.content}</p>
                    <div style={{ padding: '12px 18px', background: col + '0d', border: `1px solid ${col}2a`, borderRadius: 8 }}>
                      <span style={{ fontSize: 10, color: col, letterSpacing: 1, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>SPEAKER NOTE  </span>
                      <span style={{ fontSize: 13, color: 'rgba(232,244,255,0.4)', fontStyle: 'italic' }}>{slide.speakerNote}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        {/* ── Tech in plain English ── */}
        {data.analogy?.techAnalogies?.length ? (
          <section style={{ marginBottom: 56 }}>
            <SectionHeader label="TECH IN PLAIN ENGLISH" subtitle="What every piece of the stack actually does" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
              {data.analogy.techAnalogies.slice(0, 9).map((a, i) => {
                const catColor = CATEGORY_COLOR[data.codeReader?.techStack?.find(t => t.name.toLowerCase() === a.tech.toLowerCase())?.category || ''] || '#88B5FC';
                return (
                  <div key={i} style={{ background: 'rgba(8,18,38,0.7)', border: `1px solid rgba(255,255,255,0.06)`, borderRadius: 12, padding: '18px 20px', borderTop: `2px solid ${catColor}55` }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'rgba(232,244,255,0.9)', marginBottom: 8 }}>{a.tech}</div>
                    <div style={{ fontSize: 13, color: 'rgba(232,244,255,0.55)', lineHeight: 1.6, fontStyle: 'italic' }}>"{a.analogy}"</div>
                    {a.what && <div style={{ fontSize: 11, color: 'rgba(232,244,255,0.28)', marginTop: 8, lineHeight: 1.5 }}>{a.what}</div>}
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        {/* ── Key Issues ── */}
        {data.insight?.redFlags?.length ? (
          <section style={{ marginBottom: 56 }}>
            <SectionHeader label="KEY ISSUES" subtitle="Risks that need attention" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.insight.redFlags.slice(0, 5).map((flag, i) => (
                <div key={i} style={{ padding: '16px 20px', background: 'rgba(8,18,38,0.7)', border: '1px solid rgba(255,255,255,0.06)', borderLeft: `3px solid ${SEVERITY_COLOR[flag.severity] || '#88B5FC'}`, borderRadius: 10 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 10, padding: '3px 10px', background: (SEVERITY_COLOR[flag.severity] || '#88B5FC') + '22', color: SEVERITY_COLOR[flag.severity] || '#88B5FC', borderRadius: 4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, whiteSpace: 'nowrap', marginTop: 1 }}>
                      {flag.severity}
                    </span>
                    <div>
                      <div style={{ color: 'rgba(232,244,255,0.8)', fontSize: 13, lineHeight: 1.5, marginBottom: 4 }}>{flag.issue}</div>
                      <div style={{ color: 'rgba(232,244,255,0.3)', fontSize: 12 }}>→ {flag.suggestion}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* ── Architecture Overview (text only) ── */}
        {data.codeReader?.architectureMap?.description && (
          <section style={{ marginBottom: 56 }}>
            <SectionHeader label="ARCHITECTURE OVERVIEW" subtitle="How the system fits together" />
            <div style={{ padding: '24px 28px', background: 'rgba(8,18,38,0.7)', border: '1px solid rgba(255,255,255,0.06)', borderLeft: '3px solid #8B5CF6', borderRadius: 12 }}>
              <p style={{ color: 'rgba(232,244,255,0.6)', fontSize: 14, margin: 0, lineHeight: 1.85 }}>{data.codeReader.architectureMap.description}</p>
            </div>
          </section>
        )}

        {/* ── CTA footer ── */}
        <div style={{ textAlign: 'center', padding: '40px 0 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: 10, color: 'rgba(136,181,252,0.3)', letterSpacing: 4, textTransform: 'uppercase', marginBottom: 16, fontFamily: "'JetBrains Mono',monospace" }}>
            Generated by PayStream · 4 AI Agents · Paid on Hedera
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={copyLink}
              style={{ padding: '12px 28px', background: copied ? 'rgba(16,185,129,0.1)' : 'rgba(136,181,252,0.08)', border: `1px solid ${copied ? 'rgba(16,185,129,0.35)' : 'rgba(136,181,252,0.25)'}`, borderRadius: 10, color: copied ? '#34D399' : '#88B5FC', fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.3s' }}
            >
              {copied ? '✓ Link Copied!' : '⎘ Copy Report Link'}
            </button>
            <button
              onClick={() => navigate('/analyze')}
              style={{ padding: '12px 28px', background: 'linear-gradient(135deg, #7E3FF2, #4F46E5)', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: '0 0 24px rgba(126,63,242,0.35)' }}
            >
              ⬡ Analyze Your Own Repo
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=JetBrains+Mono:wght@400;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spinIcon { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn   { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        body { background: #020B18; }
      `}</style>
    </div>
  );
};

// ─── Section header helper ────────────────────────────────────────────────────

const SectionHeader = ({ label, subtitle }: { label: string; subtitle: string }) => (
  <div style={{ marginBottom: 24 }}>
    <div style={{ color: 'rgba(136,181,252,0.55)', fontSize: 10, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', fontFamily: "'JetBrains Mono',monospace", marginBottom: 4 }}>{label}</div>
    <div style={{ color: 'rgba(232,244,255,0.25)', fontSize: 12 }}>{subtitle}</div>
  </div>
);

export default ShareReport;
