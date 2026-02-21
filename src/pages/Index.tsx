import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import WalletButton from "../components/WalletButton";

/* ─── Agent config ──────────────────────────────────────────── */
const AGENT_MAP: Record<string, { color: string; rgb: string; icon: string; short: string }> = {
  "Code Reader Agent": { color: "#8B5CF6", rgb: "139,92,246",  icon: "◈", short: "Code Reader" },
  "Simplifier Agent":  { color: "#38B2F6", rgb: "56,178,246",  icon: "◇", short: "Simplifier"  },
  "Analogy Agent":     { color: "#88B5FC", rgb: "136,181,252", icon: "◆", short: "Analogy"     },
  "Insight Agent":     { color: "#10B981", rgb: "16,185,129",  icon: "◉", short: "Insight"     },
  "Research Agent":    { color: "#8B5CF6", rgb: "139,92,246",  icon: "◈", short: "Code Reader" },
  "Analysis Agent":    { color: "#88B5FC", rgb: "136,181,252", icon: "◆", short: "Analogy"     },
  "Writer Agent":      { color: "#10B981", rgb: "16,185,129",  icon: "◉", short: "Simplifier"  },
};

const getAgent = (name: string) =>
  AGENT_MAP[name] ?? { color: "#88B5FC", rgb: "136,181,252", icon: "◈", short: name };

/* ─── Types ─────────────────────────────────────────────────── */
type Phase = "idle" | "running" | "complete";

interface Step {
  agent: string; task: string; payment: number;
  txId: string; status: "working" | "complete";
}

/* ─── Mermaid renderer ──────────────────────────────────────── */
const MermaidDiagram = ({ code }: { code: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let cancelled = false;
    import("mermaid").then((m) => {
      m.default.initialize({
        startOnLoad: false, theme: "dark",
        themeVariables: { darkMode: true, background: "#020B18", primaryColor: "#7E3FF2", primaryTextColor: "#E8F4FF", lineColor: "#88B5FC" },
      });
      if (!cancelled && ref.current) {
        m.default.render("ps-mermaid-" + Date.now(), code).then(({ svg }) => {
          if (ref.current) ref.current.innerHTML = svg;
        }).catch(() => {
          if (ref.current) ref.current.innerHTML = `<pre style="color:#E8F4FF;font-size:13px;white-space:pre-wrap">${code}</pre>`;
        });
      }
    });
    return () => { cancelled = true; };
  }, [code]);
  return <div ref={ref} className="da2-mermaid" />;
};

const extractMermaid = (text: string) => {
  const blocks: string[] = [];
  const re = /```mermaid\n([\s\S]*?)```/g;
  let m;
  while ((m = re.exec(text)) !== null) blocks.push(m[1].trim());
  return blocks;
};

const TABS = [
  { id: "report",   label: "Full Report",     icon: "◈" },
  { id: "mermaid",  label: "Flow Diagrams",   icon: "◆" },
  { id: "glossary", label: "Jargon Glossary", icon: "◇" },
];

const AGENT_NAMES = ["Code Reader Agent", "Simplifier Agent", "Analogy Agent", "Insight Agent"];

/* ─── Component ─────────────────────────────────────────────── */
export default function Index() {
  const navigate = useNavigate();
  const [task, setTask]               = useState("");
  const [budget, setBudget]           = useState(1);
  const [phase, setPhase]             = useState<Phase>("idle");
  const [steps, setSteps]             = useState<Step[]>([]);
  const [currentBudget, setCurrentBudget] = useState(1);
  const [finalReport, setFinalReport] = useState("");
  const [refundAmount, setRefundAmount] = useState(0);
  const [refundTxId, setRefundTxId]   = useState("");
  const [errorMsg, setErrorMsg]       = useState("");
  const [activeTab, setActiveTab]     = useState("report");
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [steps]);

  const deploy = () => {
    if (phase !== "idle") return;
    const taskToRun = task.trim() || "Research the top 3 AI and crypto projects announced this week";
    setCurrentBudget(budget);
    setSteps([]); setFinalReport(""); setRefundAmount(0);
    setRefundTxId(""); setErrorMsg(""); setPhase("running"); setActiveTab("report");

    const url = `http://localhost:3001/api/run?task=${encodeURIComponent(taskToRun)}&budget=${budget}`;
    const es = new EventSource(url);

    es.onmessage = (e) => {
      const ev = JSON.parse(e.data);
      if (ev.type === "step_start") {
        setSteps((prev) => [...prev, { agent: ev.agent, task: ev.task, payment: 0, txId: "", status: "working" }]);
      }
      if (ev.type === "step_complete") {
        setSteps((prev) => prev.map((s) =>
          s.agent === ev.agent && s.status === "working"
            ? { ...s, payment: ev.payment, txId: ev.txId, status: "complete" } : s
        ));
        setCurrentBudget(ev.remainingBudget);
      }
      if (ev.type === "report")  { setFinalReport(ev.text); }
      if (ev.type === "refund")  { setRefundAmount(ev.amount); setRefundTxId(ev.txId); setPhase("complete"); es.close(); }
      if (ev.type === "error")   { setErrorMsg(ev.message); setPhase("idle"); es.close(); }
    };

    es.onerror = () => {
      setErrorMsg("Could not connect to PayStream server. Make sure the backend is running on port 3001.");
      setPhase("idle"); es.close();
    };
  };

  const reset = () => {
    setPhase("idle"); setSteps([]); setFinalReport("");
    setRefundAmount(0); setRefundTxId(""); setErrorMsg(""); setCurrentBudget(budget);
  };

  const mermaidBlocks = extractMermaid(finalReport);
  const spentBudget   = budget - currentBudget;

  return (
    <div className="da2-root">
      {/* Background glow */}
      <div className="da2-bg-orb da2-bg-orb-1" />
      <div className="da2-bg-orb da2-bg-orb-2" />

      {/* ── Nav ── */}
      <motion.nav
        className="da2-nav"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <button onClick={() => navigate("/")} className="da2-nav-logo">
          <span style={{ opacity: 0.45 }}>←</span> PAYSTREAM
        </button>

        <div className="da2-nav-center">
          <AnimatePresence mode="wait">
            {phase === "running" && (
              <motion.div
                key="running"
                className="da2-nav-status"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <span className="da2-live-dot" />
                <span>Agents Running</span>
              </motion.div>
            )}
            {phase === "complete" && (
              <motion.div
                key="complete"
                className="da2-nav-status da2-nav-done"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <span style={{ color: "#10B981" }}>◉</span>
                <span>Analysis Complete</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {phase !== "idle" && (
            <motion.div
              className="da2-nav-budget"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <span className="da2-bl">BUDGET</span>
              <span className="da2-bv">{currentBudget.toFixed(3)}</span>
              <span className="da2-bu">HBAR</span>
            </motion.div>
          )}
          <WalletButton />
        </div>
      </motion.nav>

      <div className="da2-layout">
        {/* ── Sidebar ── */}
        <motion.aside
          className="da2-sidebar"
          initial={{ x: -40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="da2-sidebar-inner">
            <div className="da2-sidebar-head">
              <h1 className="da2-title">Analyze a<br /><em>Codebase</em></h1>
              <p className="da2-title-sub">Submit a repo. 4 AI agents deploy, each paid in HBAR as they work.</p>
            </div>

            <AnimatePresence mode="wait">
              {phase === "idle" && (
                <motion.div
                  key="form"
                  className="da2-form"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="da2-field">
                    <label className="da2-label">TASK / REPO URL</label>
                    <textarea
                      value={task}
                      onChange={(e) => setTask(e.target.value)}
                      placeholder="e.g. github.com/user/repo — or describe what to analyze"
                      className="da2-textarea"
                      rows={4}
                    />
                  </div>

                  <div className="da2-field">
                    <div className="da2-budget-row">
                      <label className="da2-label">BUDGET</label>
                      <span className="da2-budget-display">
                        {budget.toFixed(1)}<span className="da2-hbar"> HBAR</span>
                      </span>
                    </div>
                    <div className="da2-slider-wrap">
                      <input
                        type="range" min={0.5} max={5} step={0.5} value={budget}
                        onChange={(e) => setBudget(parseFloat(e.target.value))}
                        className="da2-slider"
                      />
                      <div className="da2-slider-track">
                        <div className="da2-slider-fill" style={{ width: `${((budget - 0.5) / 4.5) * 100}%` }} />
                      </div>
                    </div>
                    <div className="da2-slider-labels"><span>0.5</span><span>5.0</span></div>
                  </div>

                  <motion.button
                    onClick={deploy}
                    className="da2-deploy-btn"
                    whileHover={{ scale: 1.02, boxShadow: '0 0 60px rgba(126,63,242,0.55)' }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <span className="da2-deploy-icon">⬡</span>
                    Deploy Agents
                  </motion.button>

                  <p className="da2-form-note">Runs on Hedera Testnet · No wallet setup required</p>
                </motion.div>
              )}

              {phase !== "idle" && (
                <motion.div
                  key="agents"
                  className="da2-agent-panel"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="da2-agents-heading">ACTIVE AGENTS</div>
                  {AGENT_NAMES.map((agentName) => {
                    const step = steps.find((s) => s.agent === agentName || AGENT_MAP[s.agent]?.short === AGENT_MAP[agentName]?.short);
                    const cfg  = getAgent(agentName);
                    const status = step ? step.status : "idle";
                    return (
                      <motion.div
                        key={agentName}
                        className="da2-agent-row"
                        style={{ '--ac': cfg.color, '--ar': cfg.rgb } as React.CSSProperties}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: AGENT_NAMES.indexOf(agentName) * 0.08 }}
                      >
                        <div className="da2-dot-wrap">
                          <span className="da2-agent-icon">{cfg.icon}</span>
                          {status === "working" && (
                            <motion.span
                              className="da2-working-ring"
                              animate={{ scale: [1, 1.8], opacity: [0.5, 0] }}
                              transition={{ repeat: Infinity, duration: 1.4, ease: "easeOut" }}
                            />
                          )}
                        </div>
                        <div className="da2-row-info">
                          <span className="da2-row-name">{cfg.short}</span>
                          <span className="da2-row-status">
                            {status === "idle"     && <span style={{ color: 'rgba(232,244,255,0.22)' }}>waiting</span>}
                            {status === "working"  && <span style={{ color: cfg.color, fontFamily: "'JetBrains Mono',monospace", fontSize: 10 }}>working...</span>}
                            {status === "complete" && <span style={{ color: '#10B981', fontFamily: "'JetBrains Mono',monospace", fontSize: 10 }}>✓ {step?.payment} HBAR</span>}
                          </span>
                        </div>
                        {status === "complete" && step?.txId && (
                          <a href={`https://hashscan.io/testnet/transaction/${step.txId}`} target="_blank" rel="noopener noreferrer" className="da2-tx-link">↗</a>
                        )}
                        {status === "complete" && (
                          <motion.div
                            className="da2-row-complete-bar"
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            style={{ background: cfg.color }}
                          />
                        )}
                      </motion.div>
                    );
                  })}

                  {/* Budget meter */}
                  <div className="da2-meter">
                    <div className="da2-meter-row">
                      <span className="da2-meter-label">Spent</span>
                      <span className="da2-meter-val">{spentBudget.toFixed(3)} HBAR</span>
                    </div>
                    <div className="da2-meter-bar">
                      <motion.div
                        className="da2-meter-fill"
                        animate={{ width: `${Math.min((spentBudget / budget) * 100, 100)}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                      />
                    </div>
                    <div className="da2-meter-row">
                      <span className="da2-meter-label">Remaining</span>
                      <span className="da2-meter-val" style={{ color: "#10B981" }}>{currentBudget.toFixed(3)} HBAR</span>
                    </div>
                  </div>

                  {phase === "complete" && (
                    <motion.button
                      onClick={reset}
                      className="da2-reset-btn"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      whileHover={{ borderColor: 'rgba(136,181,252,0.5)' }}
                    >
                      + New Analysis
                    </motion.button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.aside>

        {/* ── Main panel ── */}
        <main className="da2-main">
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                className="da2-error"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <span style={{ color: '#F87171', fontSize: 16, flexShrink: 0 }}>⚠</span>
                <span>{errorMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Idle state */}
          {phase === "idle" && !errorMsg && (
            <motion.div
              className="da2-idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.8 }}
            >
              <div className="da2-idle-orb" />
              <motion.div
                className="da2-idle-grid"
                initial="hidden"
                animate="visible"
                variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }}
              >
                {[
                  { icon: "◈", label: "Architecture Map",    color: "#8B5CF6" },
                  { icon: "◇", label: "Tech Stack",          color: "#38B2F6" },
                  { icon: "◆", label: "Code Flow",           color: "#88B5FC" },
                  { icon: "◉", label: "Risk Report",         color: "#10B981" },
                  { icon: "⬡", label: "Mermaid Diagrams",    color: "#8B5CF6" },
                  { icon: "◈", label: "Jargon Glossary",     color: "#38B2F6" },
                ].map((f) => (
                  <motion.div
                    key={f.label}
                    className="da2-idle-card"
                    style={{ '--fc': f.color } as React.CSSProperties}
                    variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                    whileHover={{ y: -5, borderColor: `${f.color}44` }}
                  >
                    <span className="da2-idle-icon" style={{ color: f.color }}>{f.icon}</span>
                    <span className="da2-idle-label">{f.label}</span>
                  </motion.div>
                ))}
              </motion.div>
              <p className="da2-idle-hint">Configure your task and click <strong>Deploy Agents</strong> to begin.</p>
            </motion.div>
          )}

          {/* Running: live feed */}
          {phase === "running" && (
            <motion.div
              className="da2-feed-wrap"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="da2-feed-head">
                <span className="da2-feed-title">LIVE ACTIVITY FEED</span>
                <div className="da2-feed-indicator">
                  <span className="da2-live-dot" style={{ width: 5, height: 5 }} />
                  <span>streaming</span>
                </div>
              </div>
              <div ref={feedRef} className="da2-feed">
                <AnimatePresence>
                  {steps.map((step, i) => {
                    const cfg = getAgent(step.agent);
                    return (
                      <motion.div
                        key={i}
                        className="da2-feed-item"
                        style={{ '--ac': cfg.color, '--ar': cfg.rgb } as React.CSSProperties}
                        initial={{ opacity: 0, x: -20, y: 10 }}
                        animate={{ opacity: 1, x: 0, y: 0 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <div className="da2-feed-agent" style={{ color: cfg.color, borderColor: `rgba(${cfg.rgb},0.25)`, background: `rgba(${cfg.rgb},0.07)` }}>
                          <span>{cfg.icon}</span><span>{cfg.short}</span>
                        </div>
                        <span className="da2-feed-task">{step.task}</span>
                        <div className="da2-feed-right">
                          {step.status === "working" ? (
                            <motion.span
                              animate={{ rotate: 360 }}
                              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                              style={{ display: 'inline-block', color: `rgba(${cfg.rgb},0.6)`, fontSize: 16 }}
                            >◌</motion.span>
                          ) : (
                            <>
                              <span className="da2-feed-paid">{step.payment} HBAR</span>
                              {step.txId && (
                                <a href={`https://hashscan.io/testnet/transaction/${step.txId}`} target="_blank" rel="noopener noreferrer" className="da2-feed-tx">↗ tx</a>
                              )}
                            </>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* Complete: results */}
          {phase === "complete" && (
            <motion.div
              className="da2-results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {/* Refund banner */}
              {refundAmount > 0 && (
                <motion.div
                  className="da2-refund"
                  initial={{ opacity: 0, y: -10, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                >
                  <div className="da2-refund-inner">
                    <span className="da2-refund-icon">✓</span>
                    <div>
                      <div className="da2-refund-amount">REFUNDED {refundAmount.toFixed(3)} HBAR</div>
                      {refundTxId && (
                        <a href={`https://hashscan.io/testnet/transaction/${refundTxId}`} target="_blank" rel="noopener noreferrer" className="da2-refund-link">
                          view refund on HashScan ↗
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Tabs */}
              <div className="da2-tabs">
                {TABS.filter((t) => t.id !== "mermaid" || mermaidBlocks.length > 0).map((tab) => (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`da2-tab ${activeTab === tab.id ? "da2-tab-active" : ""}`}
                    whileHover={{ backgroundColor: activeTab === tab.id ? undefined : 'rgba(255,255,255,0.03)' }}
                  >
                    <span>{tab.icon}</span><span>{tab.label}</span>
                    {tab.id === "mermaid" && mermaidBlocks.length > 0 && (
                      <span className="da2-tab-badge">{mermaidBlocks.length}</span>
                    )}
                  </motion.button>
                ))}
              </div>

              {/* Tab content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  className="da2-tab-content"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  {activeTab === "report" && finalReport && (
                    <div className="da2-report">
                      <pre className="da2-report-text">{finalReport}</pre>
                    </div>
                  )}
                  {activeTab === "mermaid" && (
                    <div className="da2-mermaid-tab">
                      {mermaidBlocks.length === 0 ? (
                        <div className="da2-empty">No Mermaid diagrams found in the report.</div>
                      ) : (
                        mermaidBlocks.map((code, i) => (
                          <div key={i} className="da2-mermaid-wrap">
                            <div className="da2-mermaid-label">Diagram {i + 1}</div>
                            <MermaidDiagram code={code} />
                          </div>
                        ))
                      )}
                    </div>
                  )}
                  {activeTab === "glossary" && (
                    <div className="da2-glossary">
                      {finalReport ? (
                        <pre className="da2-report-text">{finalReport}</pre>
                      ) : (
                        <div className="da2-empty">No glossary generated.</div>
                      )}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Completed feed */}
              {steps.length > 0 && (
                <div className="da2-completed">
                  <div className="da2-completed-head">COMPLETED STEPS</div>
                  {steps.map((step, i) => {
                    const cfg = getAgent(step.agent);
                    return (
                      <motion.div
                        key={i}
                        className="da2-completed-row"
                        style={{ '--ac': cfg.color } as React.CSSProperties}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <span style={{ color: cfg.color }}>{cfg.icon}</span>
                        <span className="da2-c-name">{cfg.short}</span>
                        <span className="da2-c-task">{step.task}</span>
                        <span className="da2-c-paid">{step.payment} HBAR</span>
                        {step.txId && (
                          <a href={`https://hashscan.io/testnet/transaction/${step.txId}`} target="_blank" rel="noopener noreferrer" className="da2-feed-tx">↗</a>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </main>
      </div>

      {/* ── Styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=JetBrains+Mono:wght@400;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .da2-root {
          background: #020B18; color: #E8F4FF;
          font-family: 'DM Sans', sans-serif; min-height: 100vh;
          display: flex; flex-direction: column; position: relative; overflow: hidden;
        }
        .da2-bg-orb {
          position: fixed; border-radius: 50%;
          pointer-events: none; filter: blur(100px); z-index: 0;
        }
        .da2-bg-orb-1 {
          width: 600px; height: 600px; top: -200px; right: -100px;
          background: radial-gradient(circle, rgba(126,63,242,0.08), transparent 70%);
        }
        .da2-bg-orb-2 {
          width: 400px; height: 400px; bottom: 0; left: 0;
          background: radial-gradient(circle, rgba(56,178,246,0.06), transparent 70%);
        }

        /* ── Nav ── */
        .da2-nav {
          position: sticky; top: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 36px;
          background: rgba(2,11,24,0.85); backdrop-filter: blur(28px);
          border-bottom: 1px solid rgba(136,181,252,0.07); height: 58px;
          position: relative; z-index: 100;
        }
        .da2-nav-logo {
          font-family: 'Orbitron', sans-serif; font-size: 13px; font-weight: 900;
          letter-spacing: 5px; color: rgba(232,244,255,0.55);
          background: none; border: none; cursor: pointer;
          transition: color 0.2s; padding: 0; display: flex; align-items: center; gap: 8px;
        }
        .da2-nav-logo:hover { color: #E8F4FF; }
        .da2-nav-center { position: absolute; left: 50%; transform: translateX(-50%); }
        .da2-nav-status {
          display: flex; align-items: center; gap: 8px;
          font-family: 'JetBrains Mono', monospace; font-size: 11px;
          letter-spacing: 1.5px; text-transform: uppercase; color: rgba(136,181,252,0.8);
        }
        .da2-nav-done { color: rgba(52,211,153,0.8) !important; }
        .da2-live-dot {
          display: inline-block; width: 7px; height: 7px; border-radius: 50%;
          background: #88B5FC; box-shadow: 0 0 10px rgba(136,181,252,0.8);
          animation: da2-pulse-dot 2s ease-in-out infinite; flex-shrink: 0;
        }
        .da2-nav-budget { display: flex; align-items: baseline; gap: 5px; }
        .da2-bl {
          font-family: 'JetBrains Mono', monospace; font-size: 9px;
          letter-spacing: 1.5px; color: rgba(232,244,255,0.28); text-transform: uppercase;
        }
        .da2-bv {
          font-family: 'Orbitron', monospace; font-size: 15px;
          font-weight: 700; color: #E8F4FF;
        }
        .da2-bu {
          font-family: 'JetBrains Mono', monospace; font-size: 10px;
          color: rgba(136,181,252,0.55); letter-spacing: 1px;
        }

        /* ── Layout ── */
        .da2-layout {
          flex: 1; display: flex;
          height: calc(100vh - 58px); overflow: hidden;
          position: relative; z-index: 1;
        }

        /* ── Sidebar ── */
        .da2-sidebar {
          width: 330px; flex-shrink: 0;
          border-right: 1px solid rgba(136,181,252,0.07);
          overflow-y: auto; background: rgba(8,18,38,0.4);
          backdrop-filter: blur(16px);
        }
        .da2-sidebar::-webkit-scrollbar { width: 3px; }
        .da2-sidebar::-webkit-scrollbar-thumb { background: rgba(136,181,252,0.15); border-radius: 2px; }
        .da2-sidebar-inner { padding: 36px 30px 44px; }
        .da2-sidebar-head { margin-bottom: 36px; }
        .da2-title {
          font-family: 'Orbitron', sans-serif; font-size: 28px; font-weight: 700;
          color: #E8F4FF; line-height: 1.2; margin-bottom: 12px; letter-spacing: -0.3px;
        }
        .da2-title em { font-style: italic; color: #88B5FC; }
        .da2-title-sub { font-size: 12.5px; color: rgba(232,244,255,0.32); line-height: 1.7; }

        /* Form */
        .da2-form { display: flex; flex-direction: column; gap: 26px; }
        .da2-field { display: flex; flex-direction: column; gap: 9px; }
        .da2-label {
          font-family: 'JetBrains Mono', monospace; font-size: 9.5px;
          color: rgba(136,181,252,0.45); letter-spacing: 2.5px; text-transform: uppercase;
        }
        .da2-textarea {
          background: rgba(8,20,45,0.6);
          border: 1px solid rgba(136,181,252,0.15); border-radius: 12px;
          color: #E8F4FF; font-family: 'DM Sans', sans-serif; font-size: 13.5px;
          padding: 13px 15px; resize: vertical; outline: none; line-height: 1.6;
          transition: border-color 0.2s, box-shadow 0.2s;
          backdrop-filter: blur(8px);
        }
        .da2-textarea::placeholder { color: rgba(232,244,255,0.18); }
        .da2-textarea:focus {
          border-color: rgba(136,181,252,0.4);
          box-shadow: 0 0 0 3px rgba(136,181,252,0.07);
        }
        .da2-budget-row { display: flex; align-items: center; justify-content: space-between; }
        .da2-budget-display {
          font-family: 'Orbitron', monospace; font-size: 18px;
          font-weight: 700; color: #88B5FC;
        }
        .da2-hbar { font-size: 10px; font-weight: 400; color: rgba(136,181,252,0.45); margin-left: 3px; }
        .da2-slider-wrap { position: relative; padding: 10px 0; }
        .da2-slider {
          width: 100%; -webkit-appearance: none; appearance: none;
          height: 2px; background: transparent; outline: none;
          position: relative; z-index: 2;
        }
        .da2-slider::-webkit-slider-thumb {
          -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%;
          background: #7E3FF2; box-shadow: 0 0 16px rgba(126,63,242,0.7);
          cursor: pointer; border: 2px solid rgba(255,255,255,0.2);
        }
        .da2-slider-track {
          position: absolute; top: 50%; left: 0; right: 0;
          transform: translateY(-50%); height: 2px;
          background: rgba(136,181,252,0.12); border-radius: 2px; z-index: 1;
        }
        .da2-slider-fill {
          height: 100%; background: linear-gradient(to right, #7E3FF2, #88B5FC);
          border-radius: 2px; transition: width 0.1s;
        }
        .da2-slider-labels {
          display: flex; justify-content: space-between;
          font-family: 'JetBrains Mono', monospace; font-size: 10px;
          color: rgba(232,244,255,0.18); margin-top: 4px;
        }
        .da2-deploy-btn {
          display: flex; align-items: center; justify-content: center; gap: 10px;
          width: 100%; padding: 15px;
          background: linear-gradient(135deg, #7E3FF2 0%, #4F46E5 100%);
          color: #fff; font-family: 'DM Sans', sans-serif;
          font-size: 15px; font-weight: 700; border: none; border-radius: 12px;
          cursor: pointer; letter-spacing: 0.3px; transition: all 0.3s;
          box-shadow: 0 0 36px rgba(126,63,242,0.38), inset 0 1px 0 rgba(255,255,255,0.1);
        }
        .da2-deploy-icon { font-size: 18px; }
        .da2-form-note {
          text-align: center; font-size: 11px;
          color: rgba(232,244,255,0.18); letter-spacing: 0.3px;
        }

        /* Agent panel */
        .da2-agent-panel { display: flex; flex-direction: column; gap: 0; }
        .da2-agents-heading {
          font-family: 'JetBrains Mono', monospace; font-size: 9.5px;
          letter-spacing: 2.5px; color: rgba(136,181,252,0.4); text-transform: uppercase; margin-bottom: 16px;
        }
        .da2-agent-row {
          display: flex; align-items: center; gap: 12px;
          padding: 13px 15px;
          background: rgba(255,255,255,0.018);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 10px; margin-bottom: 7px;
          position: relative; overflow: hidden;
          transition: border-color 0.3s;
        }
        .da2-dot-wrap {
          position: relative; width: 30px; height: 30px;
          display: flex; align-items: center; justify-content: center;
        }
        .da2-agent-icon { font-size: 17px; color: var(--ac); z-index: 1; }
        .da2-working-ring {
          position: absolute; inset: -3px; border-radius: 50%;
          border: 1.5px solid var(--ac); opacity: 0.5;
        }
        .da2-row-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
        .da2-row-name { font-size: 13px; font-weight: 600; color: #E8F4FF; }
        .da2-row-status { font-size: 11px; }
        .da2-tx-link {
          font-family: 'JetBrains Mono', monospace; font-size: 11px;
          color: rgba(56,178,246,0.6); text-decoration: none; transition: color 0.2s;
        }
        .da2-tx-link:hover { color: #38B2F6; }
        .da2-row-complete-bar {
          position: absolute; bottom: 0; left: 0; right: 0; height: 1.5px;
          transform-origin: left; opacity: 0.4;
        }

        /* Meter */
        .da2-meter {
          margin-top: 22px; padding: 18px;
          background: rgba(255,255,255,0.018);
          border: 1px solid rgba(255,255,255,0.05); border-radius: 10px;
        }
        .da2-meter-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 9px; }
        .da2-meter-row:last-child { margin-bottom: 0; margin-top: 9px; }
        .da2-meter-label { font-size: 11px; color: rgba(232,244,255,0.28); font-family: 'JetBrains Mono', monospace; }
        .da2-meter-val { font-family: 'Orbitron', monospace; font-size: 12px; color: #E8F4FF; font-weight: 700; }
        .da2-meter-bar { height: 3px; background: rgba(255,255,255,0.06); border-radius: 2px; overflow: hidden; }
        .da2-meter-fill { height: 100%; background: linear-gradient(to right, #7E3FF2, #88B5FC); border-radius: 2px; }
        .da2-reset-btn {
          margin-top: 16px; width: 100%; padding: 12px;
          background: transparent;
          border: 1px solid rgba(136,181,252,0.22); color: rgba(136,181,252,0.6);
          font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600;
          border-radius: 10px; cursor: pointer; transition: all 0.2s; letter-spacing: 0.3px;
        }
        .da2-reset-btn:hover { background: rgba(136,181,252,0.07); color: #88B5FC; }

        /* ── Main ── */
        .da2-main { flex: 1; overflow-y: auto; padding: 36px; position: relative; z-index: 1; }
        .da2-main::-webkit-scrollbar { width: 3px; }
        .da2-main::-webkit-scrollbar-thumb { background: rgba(136,181,252,0.15); border-radius: 2px; }

        .da2-error {
          display: flex; align-items: flex-start; gap: 13px;
          padding: 16px 20px;
          background: rgba(239,68,68,0.06); border: 1px solid rgba(239,68,68,0.2);
          border-radius: 12px; color: rgba(252,165,165,0.9); font-size: 13.5px;
          line-height: 1.6; margin-bottom: 24px;
        }

        /* Idle */
        .da2-idle {
          height: 100%; min-height: 500px;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 28px; position: relative;
        }
        .da2-idle-orb {
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 500px; height: 500px; border-radius: 50%;
          background: radial-gradient(circle, rgba(126,63,242,0.07) 0%, transparent 65%);
          pointer-events: none;
        }
        .da2-idle-grid {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 12px; width: 100%; max-width: 580px; position: relative; z-index: 1;
        }
        .da2-idle-card {
          padding: 22px 16px;
          background: rgba(8,20,45,0.5);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 14px; display: flex; flex-direction: column;
          align-items: center; gap: 9px; transition: all 0.3s; cursor: default;
          backdrop-filter: blur(12px);
        }
        .da2-idle-icon { font-size: 24px; }
        .da2-idle-label {
          font-size: 12px; font-weight: 600; color: rgba(232,244,255,0.45);
          text-align: center; line-height: 1.3;
        }
        .da2-idle-hint {
          font-size: 13px; color: rgba(232,244,255,0.22); line-height: 1.6;
          position: relative; z-index: 1;
        }
        .da2-idle-hint strong { color: rgba(232,244,255,0.45); font-weight: 600; }

        /* Live feed */
        .da2-feed-wrap { height: 100%; display: flex; flex-direction: column; gap: 0; }
        .da2-feed-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
        .da2-feed-title {
          font-family: 'JetBrains Mono', monospace; font-size: 10px;
          letter-spacing: 3px; color: rgba(136,181,252,0.45); text-transform: uppercase;
        }
        .da2-feed-indicator {
          display: flex; align-items: center; gap: 7px;
          font-family: 'JetBrains Mono', monospace; font-size: 10px;
          color: rgba(136,181,252,0.4); letter-spacing: 1px;
        }
        .da2-feed { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 9px; }
        .da2-feed::-webkit-scrollbar { width: 3px; }
        .da2-feed::-webkit-scrollbar-thumb { background: rgba(136,181,252,0.15); border-radius: 2px; }
        .da2-feed-item {
          display: flex; align-items: center; gap: 13px;
          padding: 14px 18px;
          background: rgba(8,20,45,0.5);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 12px; flex-shrink: 0;
          backdrop-filter: blur(10px);
        }
        .da2-feed-agent {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 4px 11px; border-radius: 6px; border: 1px solid;
          font-size: 11px; font-weight: 700; white-space: nowrap; flex-shrink: 0;
        }
        .da2-feed-task { flex: 1; font-size: 13px; color: rgba(232,244,255,0.65); line-height: 1.4; }
        .da2-feed-right { display: flex; align-items: center; gap: 9px; flex-shrink: 0; }
        .da2-feed-paid {
          font-family: 'Orbitron', monospace; font-size: 12px;
          font-weight: 700; color: #10B981;
        }
        .da2-feed-tx {
          font-family: 'JetBrains Mono', monospace; font-size: 11px;
          color: rgba(56,178,246,0.55); text-decoration: none;
          transition: color 0.2s; white-space: nowrap;
        }
        .da2-feed-tx:hover { color: #38B2F6; }

        /* Results */
        .da2-results { display: flex; flex-direction: column; gap: 22px; }
        .da2-refund {
          background: rgba(16,185,129,0.06);
          border: 1px solid rgba(16,185,129,0.2);
          border-radius: 14px; padding: 18px 22px;
        }
        .da2-refund-inner { display: flex; align-items: center; gap: 16px; }
        .da2-refund-icon {
          width: 38px; height: 38px; border-radius: 50%;
          background: rgba(16,185,129,0.14);
          border: 1px solid rgba(16,185,129,0.3);
          display: flex; align-items: center; justify-content: center;
          color: #34D399; font-size: 16px; flex-shrink: 0;
        }
        .da2-refund-amount {
          font-family: 'Orbitron', monospace; font-size: 14px;
          font-weight: 700; color: #34D399; letter-spacing: 1px; margin-bottom: 3px;
        }
        .da2-refund-link { font-size: 12px; color: rgba(52,211,153,0.5); text-decoration: none; transition: color 0.2s; }
        .da2-refund-link:hover { color: #34D399; }

        /* Tabs */
        .da2-tabs {
          display: flex; gap: 4px; padding: 4px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 12px; width: fit-content;
        }
        .da2-tab {
          display: flex; align-items: center; gap: 7px;
          padding: 9px 18px; background: transparent;
          border: 1px solid transparent; border-radius: 9px;
          color: rgba(232,244,255,0.38); font-family: 'DM Sans', sans-serif;
          font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s;
        }
        .da2-tab-active {
          background: rgba(136,181,252,0.1) !important;
          border-color: rgba(136,181,252,0.2) !important;
          color: #88B5FC !important;
        }
        .da2-tab-badge {
          min-width: 18px; height: 18px; border-radius: 9px;
          background: rgba(136,181,252,0.25); color: #88B5FC;
          font-size: 10px; font-weight: 700;
          display: flex; align-items: center; justify-content: center; padding: 0 4px;
        }

        /* Tab content */
        .da2-report, .da2-glossary {
          background: rgba(8,20,45,0.5);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 14px; padding: 26px;
          max-height: 500px; overflow-y: auto;
          backdrop-filter: blur(12px);
        }
        .da2-report::-webkit-scrollbar { width: 3px; }
        .da2-report::-webkit-scrollbar-thumb { background: rgba(136,181,252,0.15); border-radius: 2px; }
        .da2-report-text {
          font-family: 'JetBrains Mono', monospace; font-size: 12.5px;
          color: rgba(232,244,255,0.72); white-space: pre-wrap; line-height: 1.8;
        }
        .da2-mermaid-tab { display: flex; flex-direction: column; gap: 16px; }
        .da2-mermaid-wrap {
          background: rgba(8,20,45,0.5);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 14px; padding: 22px; overflow: auto;
          backdrop-filter: blur(12px);
        }
        .da2-mermaid-label {
          font-family: 'JetBrains Mono', monospace; font-size: 10px;
          color: rgba(136,181,252,0.45); letter-spacing: 2.5px;
          text-transform: uppercase; margin-bottom: 16px;
        }
        .da2-mermaid svg { max-width: 100%; height: auto; }
        .da2-empty { padding: 44px; text-align: center; color: rgba(232,244,255,0.22); font-size: 13px; }

        /* Completed */
        .da2-completed {
          background: rgba(8,20,45,0.4);
          border: 1px solid rgba(255,255,255,0.04);
          border-radius: 14px; padding: 22px;
          backdrop-filter: blur(12px);
        }
        .da2-completed-head {
          font-family: 'JetBrains Mono', monospace; font-size: 9.5px;
          letter-spacing: 2.5px; color: rgba(136,181,252,0.32);
          text-transform: uppercase; margin-bottom: 16px;
        }
        .da2-completed-row {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 0; border-bottom: 1px solid rgba(255,255,255,0.03); font-size: 12.5px;
        }
        .da2-completed-row:last-child { border-bottom: none; }
        .da2-c-name { font-weight: 700; color: rgba(232,244,255,0.65); white-space: nowrap; min-width: 90px; }
        .da2-c-task { flex: 1; color: rgba(232,244,255,0.32); }
        .da2-c-paid { font-family: 'Orbitron', monospace; font-size: 11px; color: #10B981; white-space: nowrap; }

        /* ── Keyframes ── */
        @keyframes da2-pulse-dot {
          0%, 100% { opacity: 1; box-shadow: 0 0 10px rgba(136,181,252,0.8); }
          50%       { opacity: 0.4; box-shadow: 0 0 4px rgba(136,181,252,0.4); }
        }
      `}</style>
    </div>
  );
}
