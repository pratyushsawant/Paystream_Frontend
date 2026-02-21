

# PayStream — Single-Page Dark-Mode React App

A visually striking single-page application showcasing a mock "Multi-Agent AI Economy on Hedera" with animated task deployment, live activity feed, and budget tracking.

## Design System
- **Background:** #080b10 dark theme
- **Fonts:** JetBrains Mono (monospace) + Orbitron (display) from Google Fonts
- **Colors:** Green (#00ff88), Blue (#00aaff), Purple (#aa55ff), Orange (#ffaa00)
- **Styling:** Pure inline CSS, no component libraries

## Layout (Top to Bottom)

### 1. Header
- "PAYSTREAM" in Orbitron, large green text with wide letter-spacing
- Subtitle: "Multi-Agent AI Economy on Hedera" in muted monospace

### 2. Input Panel
- Dark card with green border containing:
  - Task textarea with placeholder text
  - Budget slider (0.5–5 HBAR, step 0.5) with live-updating label
  - "DEPLOY AGENT" button in green

### 3. Status Bar (appears on deploy)
- Pulsing green dot animation + "AGENT RUNNING..."
- Live budget counter that decreases by 0.05 per step

### 4. Live Activity Feed (appears on deploy)
- Rows fade in one-by-one with 2.5s delay
- Each row: colored agent badge (purple/blue/green) | task | 0.05 HBAR cost | "view tx" link to HashScan

### 5. Final Report (appears on completion)
- Dark card with green border, scrollable monospace report text

### 6. Refund Banner (appears on completion)
- Full-width green banner: "✓ REFUNDED X.XX HBAR"

## Mock Behavior
- Three mock agent steps with 2.5s delays between them
- Budget decreases in real-time
- After all steps complete, 1s delay then show report + refund banner
- State machine: idle → running → complete (useState + useEffect only)

