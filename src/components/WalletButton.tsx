import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const WALLETS = [
  { id: 'hashpack', name: 'HashPack',    icon: '⬡', color: '#8B5CF6', desc: 'Most popular Hedera wallet' },
  { id: 'blade',    name: 'Blade Wallet', icon: '◆', color: '#38B2F6', desc: 'Browser extension wallet'  },
  { id: 'kabila',   name: 'Kabila',       icon: '◉', color: '#10B981', desc: 'Mobile & web wallet'       },
];

function truncate(addr: string) {
  return addr.length > 12 ? `${addr.slice(0, 5)}...${addr.slice(-4)}` : addr;
}

export default function WalletButton() {
  const [connected, setConnected]   = useState(false);
  const [address, setAddress]       = useState('');
  const [balance, setBalance]       = useState('');
  const [showModal, setShowModal]   = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  /* close on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setShowModal(false);
      }
    };
    if (showModal) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showModal]);

  const connect = async (walletId: string) => {
    setConnecting(walletId);
    await new Promise(r => setTimeout(r, 1100));
    const acct = `0.0.${(Math.floor(Math.random() * 8_000_000) + 1_000_000)}`;
    const bal  = (Math.random() * 8 + 1).toFixed(2);
    setAddress(acct);
    setBalance(bal);
    setConnected(true);
    setConnecting(null);
    setShowModal(false);
  };

  const disconnect = () => {
    setConnected(false);
    setAddress('');
    setBalance('');
    setShowModal(false);
  };

  return (
    <div style={{ position: 'relative' }} ref={modalRef}>
      {/* Trigger button */}
      {!connected ? (
        <motion.button
          className="wc-btn"
          onClick={() => setShowModal(v => !v)}
          whileHover={{ scale: 1.03, boxShadow: '0 0 24px rgba(136,181,252,0.3)' }}
          whileTap={{ scale: 0.97 }}
        >
          <span className="wc-icon">⬡</span>
          Connect Wallet
        </motion.button>
      ) : (
        <motion.button
          className="wc-btn wc-connected"
          onClick={() => setShowModal(v => !v)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="wc-live-dot" />
          <span className="wc-addr">{truncate(address)}</span>
          <span className="wc-bal">{balance} ℏ</span>
        </motion.button>
      )}

      {/* Dropdown modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="wc-modal"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
          >
            {!connected ? (
              <>
                <div className="wc-modal-head">
                  <div className="wc-modal-title">Connect Wallet</div>
                  <div className="wc-modal-sub">Select a Hedera wallet to continue</div>
                </div>

                <div className="wc-wallet-list">
                  {WALLETS.map((w, i) => (
                    <motion.button
                      key={w.id}
                      className="wc-wallet-row"
                      style={{ '--wc': w.color } as React.CSSProperties}
                      disabled={!!connecting}
                      onClick={() => connect(w.id)}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      whileHover={{ x: 5, backgroundColor: `rgba(${w.color === '#8B5CF6' ? '139,92,246' : w.color === '#38B2F6' ? '56,178,246' : '16,185,129'},0.08)` }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="wc-wallet-icon" style={{ color: w.color }}>{w.icon}</span>
                      <div className="wc-wallet-info">
                        <span className="wc-wallet-name">{w.name}</span>
                        <span className="wc-wallet-desc">{w.desc}</span>
                      </div>
                      {connecting === w.id ? (
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                          style={{ marginLeft: 'auto', display: 'inline-block', color: w.color, fontSize: 16, flexShrink: 0 }}
                        >◌</motion.span>
                      ) : (
                        <span style={{ marginLeft: 'auto', color: 'rgba(232,244,255,0.2)', fontSize: 13, flexShrink: 0 }}>→</span>
                      )}
                    </motion.button>
                  ))}
                </div>

                <div className="wc-footer-note">
                  <span className="wc-hedera-badge">⬡ Hedera Testnet</span>
                </div>
              </>
            ) : (
              <>
                <div className="wc-modal-head">
                  <div className="wc-modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="wc-live-dot" />
                    Connected
                  </div>
                  <div className="wc-modal-sub" style={{ color: '#10B981' }}>Hedera Testnet</div>
                </div>

                <div className="wc-account-box">
                  <div className="wc-account-row">
                    <span className="wc-account-label">Account ID</span>
                    <span className="wc-account-val">{address}</span>
                  </div>
                  <div className="wc-account-row">
                    <span className="wc-account-label">Balance</span>
                    <span className="wc-account-val" style={{ color: '#10B981' }}>{balance} HBAR</span>
                  </div>
                </div>

                <motion.button
                  className="wc-disconnect"
                  onClick={disconnect}
                  whileHover={{ borderColor: 'rgba(239,68,68,0.5)', color: '#F87171', backgroundColor: 'rgba(239,68,68,0.05)' }}
                  whileTap={{ scale: 0.97 }}
                >
                  Disconnect
                </motion.button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        /* ── Wallet Button ── */
        .wc-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 9px 18px;
          background: transparent;
          border: 1px solid rgba(136,181,252,0.3);
          border-radius: 10px; color: #88B5FC;
          font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600;
          cursor: pointer; letter-spacing: 0.2px; transition: all 0.25s;
          white-space: nowrap;
        }
        .wc-btn:hover { background: rgba(136,181,252,0.07); border-color: rgba(136,181,252,0.55); }
        .wc-icon { font-size: 14px; }

        .wc-connected {
          border-color: rgba(16,185,129,0.35) !important;
          color: #E8F4FF !important;
          background: rgba(16,185,129,0.06) !important;
          gap: 10px !important;
        }
        .wc-live-dot {
          display: inline-block; width: 7px; height: 7px; border-radius: 50%;
          background: #10B981; box-shadow: 0 0 10px rgba(16,185,129,0.8);
          flex-shrink: 0;
          animation: wc-pulse 2.2s ease-in-out infinite;
        }
        .wc-addr {
          font-family: 'JetBrains Mono', monospace; font-size: 12px;
          color: #E8F4FF; letter-spacing: 0.3px;
        }
        .wc-bal {
          font-family: 'JetBrains Mono', monospace; font-size: 11px;
          color: #10B981; padding: 2px 8px;
          background: rgba(16,185,129,0.1);
          border: 1px solid rgba(16,185,129,0.2); border-radius: 5px;
        }

        /* ── Modal ── */
        .wc-modal {
          position: absolute; top: calc(100% + 10px); right: 0;
          min-width: 280px; z-index: 9999;
          background: rgba(4,12,28,0.95);
          border: 1px solid rgba(136,181,252,0.15);
          border-radius: 16px; padding: 20px;
          backdrop-filter: blur(32px);
          box-shadow: 0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(136,181,252,0.07), 0 0 60px rgba(126,63,242,0.08);
        }
        .wc-modal-head { margin-bottom: 18px; }
        .wc-modal-title {
          font-family: 'Orbitron', sans-serif; font-size: 13px;
          font-weight: 700; color: #E8F4FF; letter-spacing: 1px; margin-bottom: 4px;
        }
        .wc-modal-sub {
          font-size: 11px; color: rgba(232,244,255,0.35);
          font-family: 'JetBrains Mono', monospace; letter-spacing: 0.5px;
        }

        /* Wallet list */
        .wc-wallet-list { display: flex; flex-direction: column; gap: 6px; }
        .wc-wallet-row {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 14px; width: 100%;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 10px; cursor: pointer;
          transition: all 0.2s; text-align: left;
        }
        .wc-wallet-row:disabled { cursor: wait; opacity: 0.7; }
        .wc-wallet-icon { font-size: 20px; flex-shrink: 0; }
        .wc-wallet-info { display: flex; flex-direction: column; gap: 2px; flex: 1; }
        .wc-wallet-name {
          font-size: 13px; font-weight: 700; color: #E8F4FF;
          font-family: 'DM Sans', sans-serif;
        }
        .wc-wallet-desc { font-size: 10.5px; color: rgba(232,244,255,0.3); }

        /* Footer note */
        .wc-footer-note { margin-top: 14px; display: flex; justify-content: center; }
        .wc-hedera-badge {
          font-family: 'JetBrains Mono', monospace; font-size: 10px;
          color: rgba(136,181,252,0.35); letter-spacing: 1.5px; text-transform: uppercase;
          padding: 4px 10px;
          border: 1px solid rgba(136,181,252,0.1); border-radius: 6px;
        }

        /* Account box */
        .wc-account-box {
          display: flex; flex-direction: column; gap: 10px;
          padding: 14px; margin-bottom: 14px;
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.06); border-radius: 10px;
        }
        .wc-account-row { display: flex; justify-content: space-between; align-items: center; }
        .wc-account-label {
          font-size: 10.5px; color: rgba(232,244,255,0.3);
          font-family: 'JetBrains Mono', monospace; letter-spacing: 1px;
        }
        .wc-account-val {
          font-family: 'JetBrains Mono', monospace; font-size: 12px;
          color: #E8F4FF; font-weight: 700;
        }

        /* Disconnect */
        .wc-disconnect {
          width: 100%; padding: 10px;
          background: transparent;
          border: 1px solid rgba(232,244,255,0.08);
          border-radius: 8px; color: rgba(232,244,255,0.35);
          font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all 0.2s; letter-spacing: 0.3px;
        }

        @keyframes wc-pulse {
          0%, 100% { box-shadow: 0 0 10px rgba(16,185,129,0.8); opacity: 1; }
          50%       { box-shadow: 0 0 4px rgba(16,185,129,0.4); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
