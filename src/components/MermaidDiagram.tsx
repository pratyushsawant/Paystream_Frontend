import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    primaryColor: '#0d1117',
    primaryTextColor: '#e0e0e0',
    primaryBorderColor: '#00ff8844',
    lineColor: '#00ff88',
    secondaryColor: '#0d1117',
    tertiaryColor: '#161b22',
    edgeLabelBackground: '#0d1117',
    nodeTextColor: '#e0e0e0',
    mainBkg: '#0d1117',
    nodeBorder: '#00ff8844',
    clusterBkg: '#161b22',
    titleColor: '#00ff88',
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '14px',
  },
  flowchart: { curve: 'basis', htmlLabels: true },
  securityLevel: 'loose',
});

interface Props {
  chart?: string;
}

let _idCounter = 0;

// Ensure the chart string starts with a valid mermaid diagram type.
// Claude sometimes returns "graph TD" without a leading newline, which is fine,
// but it may also return fenced markdown — strip that first.
function sanitizeChart(raw: string): string {
  // Strip markdown fences if present
  let cleaned = raw.trim().replace(/^```[a-z]*\n?/i, '').replace(/```$/, '').trim();
  // Ensure it starts with a known diagram keyword
  const valid = ['graph ', 'flowchart ', 'sequenceDiagram', 'classDiagram', 'erDiagram', 'gantt', 'pie'];
  if (!valid.some((kw) => cleaned.startsWith(kw))) {
    // Prepend graph TD as default if it looks like bare node definitions
    cleaned = 'graph TD\n' + cleaned;
  }
  return cleaned;
}

const MermaidDiagram = ({ chart }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    // Guard: nothing to render
    if (!ref.current || !chart || typeof chart !== 'string' || !chart.trim()) return;

    setError(null);
    setRendered(false);

    const id = 'mermaid-diagram-' + (++_idCounter);
    const safeChart = sanitizeChart(chart);

    mermaid
      .render(id, safeChart)
      .then(({ svg }) => {
        if (!ref.current) return;
        ref.current.innerHTML = svg;
        const svgEl = ref.current.querySelector('svg');
        if (svgEl) {
          svgEl.style.maxWidth = '100%';
          svgEl.style.height = 'auto';
        }
        setRendered(true);
      })
      .catch((err) => {
        console.warn('Mermaid render failed:', err?.message || err);
        setError(safeChart);
      });
  }, [chart]);

  // Not yet given a chart
  if (!chart || !chart.trim()) {
    return (
      <div style={{ background: '#0d1117', borderRadius: 8, padding: 24, minHeight: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#333', fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>generating diagram...</span>
      </div>
    );
  }

  // Render failed — show raw source so it's still useful
  if (error) {
    return (
      <div style={{ background: '#0d1117', border: '1px solid #1a2332', borderRadius: 8, padding: 20, fontFamily: "'JetBrains Mono', monospace" }}>
        <div style={{ color: '#ffaa00', fontSize: 11, marginBottom: 12, letterSpacing: 2 }}>
          DIAGRAM SOURCE — paste at mermaid.live to view
        </div>
        <pre style={{ color: '#888', fontSize: 12, margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
          {error}
        </pre>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      style={{
        background: '#0d1117',
        borderRadius: 8,
        padding: 24,
        overflowX: 'auto',
        minHeight: rendered ? undefined : 120,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    />
  );
};

export default MermaidDiagram;
