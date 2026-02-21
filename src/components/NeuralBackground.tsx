import { useEffect, useRef } from 'react';

interface NNode {
  x: number; y: number;
  vx: number; vy: number;
  r: number; pulse: number; pulseSpeed: number;
  rgb: string; hub: boolean;
}

export default function NeuralBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const palettes = ['136,181,252', '56,178,246', '126,63,242', '136,181,252'];
    const nodes: NNode[] = Array.from({ length: 80 }, (_, i) => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
      r: Math.random() * 1.8 + 0.6,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.018 + 0.004,
      rgb: palettes[Math.floor(Math.random() * palettes.length)],
      hub: i < 12,
    }));

    const MAX_DIST = 200;
    let animId: number;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy; n.pulse += n.pulseSpeed;
        if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
      });

      // Connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MAX_DIST) {
            const alpha = (1 - dist / MAX_DIST) * 0.1;
            const grad = ctx.createLinearGradient(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y);
            grad.addColorStop(0, `rgba(${nodes[i].rgb},${alpha})`);
            grad.addColorStop(1, `rgba(${nodes[j].rgb},${alpha})`);
            ctx.beginPath();
            ctx.strokeStyle = grad;
            ctx.lineWidth = 0.6;
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Nodes
      nodes.forEach(n => {
        const pf = 0.6 + Math.sin(n.pulse) * 0.4;
        const base = n.hub ? 0.35 : 0.2;
        const a = base * pf;
        const r = n.hub ? n.r * 1.6 : n.r;

        // Glow halo
        const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 6);
        grd.addColorStop(0, `rgba(${n.rgb},${a * 0.4})`);
        grd.addColorStop(1, `rgba(${n.rgb},0)`);
        ctx.beginPath();
        ctx.arc(n.x, n.y, r * 6, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${n.rgb},${a * 1.5})`;
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <canvas
      ref={ref}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: 0.75 }}
    />
  );
}
