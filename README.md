# 🎬 NeonSnip — Code-to-Reel Animator

> Paste any code snippet → get a stunning vertical MP4 video with a live typewriter effect, neon themes, and ambient music — all inside your browser. No server. No upload. No account.

![NeonSnip](https://img.shields.io/badge/NeonSnip-Code--to--Reel-blueviolet?style=for-the-badge&logo=film)
![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![WebCodecs](https://img.shields.io/badge/WebCodecs-H.264-orange?style=for-the-badge&logo=google-chrome&logoColor=white)

---

## ✨ What is NeonSnip?

NeonSnip turns any code snippet into a **9:16 vertical MP4 video** (1080×1920 — TikTok / YouTube Shorts / Instagram Reels format) where:

- The code **types itself out** character-by-character or line-by-line with a realistic typewriter effect
- A blinking **cursor** tracks the current position with configurable neon glow
- Code is **syntax-highlighted** using VS Code–grade Shiki themes (Dracula, Synthwave 84, Monokai, Nord)
- An optional **ambient audio track** is baked directly into the exported MP4
- The output is a real **H.264 MP4** — ready to upload anywhere

**Zero server. Zero upload. Zero subscription. Everything runs in your browser.**

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Add audio tracks to public/audio/
#    Either drop your own MP3s in (named as listed in src/config/audioTracks.ts)
#    or generate placeholder WAVs with the bundled script:
node scripts/gen-audio.cjs

# 3. Start the development server
npm run dev
```

<<<<<<< HEAD
> **Production build:**
=======
Then open localhost

> **Build for production:**
>>>>>>> 4304ccf16ce061f49be925293c5f6f3dc852684c
> ```bash
> npm run build
> ```
> Output goes to `./dist`. Deploy that folder anywhere (see [Deployment](#-deployment)).

---

## 🏗️ How It Works — Under the Hood

### 1. Code Input & Syntax Highlighting (`src/utils/tokenizer.ts`)

When you paste code, NeonSnip sends it to **[Shiki](https://shiki.style/)** — the same tokenizer used inside VS Code. Shiki runs entirely in the browser via WebAssembly and returns a `ThemedToken[][]` array: every character grouped with its exact hex colour for the chosen theme.

```
Code string
  → Shiki (WASM, lazy-loaded once)
  → ThemedToken[][]  (one array per source line, each token has .content + .color)
```

Supported languages: `javascript`, `typescript`, `python`, `java`, `html`, `css`, `json`, `markdown`, `rust`, `go`.

---

### 2. Typewriter Engine (`src/utils/typewriterEngine.ts`)

A **pure, side-effect-free function** that answers: *"given N milliseconds elapsed and a WPM speed, how many characters (or lines) should be visible right now?"*

```ts
calculateVisibleContent({ elapsedMs, wpm, revealMode, totalCharsInCode }, tokens)
// → { charsToReveal, linesToReveal, isFinished }
```

Because it is deterministic, the **exact same frame is produced for the exact same timestamp** — which is critical for reliable, glitch-free video export.

- **`char` mode** — reveals characters progressively, cursor moves within a line
- **`line` mode** — reveals one full source line at a time, cursor jumps to the next line start

---

### 3. Canvas Renderer (`src/utils/canvasLayout.ts` + `src/hooks/useCanvasRenderer.ts`)

The live preview and the video export share the **same rendering logic**:

1. **Clear** the canvas (1080×1920 px)
2. **Fill** background with the theme colour
3. Optionally draw **scanlines** (thin horizontal strips every 4px — retro CRT look)
4. Compute the `CanvasLayout` (font size, padding, line height, gutter width)
5. Wrap long source lines into **visual lines** (`wrapTokensToVisualLines`) so nothing overflows
6. **Draw only the revealed portion** of each visual line using `ctx.fillText()` with per-token colours
7. Find the **cursor position** (pixel-exact via `ctx.measureText()`)
8. **Auto-scroll** — when the cursor crosses 65% of canvas height, offset everything upward so the cursor stays in view (`computeScrollOffset`)
9. Draw the **cursor** (block / line / underscore) with `ctx.shadowBlur` neon glow

For the **live preview**, this runs inside a `requestAnimationFrame` loop (~60 fps).  
For **export**, it runs frame-by-frame into an `OffscreenCanvas`.

---

### 4. Export Pipeline — Canvas → MP4 (`src/hooks/useExport.ts`)

The entire encoding pipeline lives in the browser using the **WebCodecs API** (Chrome 94+):

```
OffscreenCanvas  (1080×1920, rendered frame by frame)
        ↓
VideoEncoder     (H.264 AVC High Profile Level 5.1 — 8 Mbps, 30 fps)
        ↓
mp4-muxer        (pure JS, correct moov/duration metadata, no WASM)
        ↓  ← optional audio path
AudioEncoder     (AAC-LC, 44 100 Hz, 128 kbps — looped to match video length)
        ↓
neonsnip_export.mp4   ← downloaded directly to your device
```

**Step-by-step walkthrough:**

| Step | What happens |
|------|-------------|
| **Tokenize** | Shiki converts the code string into `ThemedToken[][]` |
| **Duration** | Total frames = `(code_length / chars_per_sec + 2 s tail) × 30 fps` |
| **Frame loop** | For each frame, `renderFrameToCtx` draws the correct typewriter state to an `OffscreenCanvas` |
| **VideoEncoder** | Each frame is wrapped in a `VideoFrame` and pushed to the browser's native H.264 encoder; keyframes every 2 s |
| **mp4-muxer** | Encoded chunks are handed to `mp4-muxer` which assembles a valid MP4 with proper timecodes |
| **Audio** | Selected MP3 is fetched, decoded with `AudioContext`, looped to fill the video duration, re-encoded as AAC-LC, and added as a second mux track |
| **Download** | `muxer.finalize()` → `Blob` → object URL → hidden `<a>` click |

> **Back-pressure** — `waitForEncoderQueue` pauses the frame loop whenever the encoder's internal queue grows beyond 4 pending frames, preventing memory spikes during long exports.

---

### 5. State Management (`src/store/useStore.ts`)

All configuration is held in a single **Zustand store** — no prop drilling, no Context boilerplate:

| Slice | Key fields |
|-------|-----------|
| Code Input | `code`, `language` |
| Theme | `themeId`, `accentHue` |
| Animation | `typingSpeedWpm`, `cursorStyle`, `cursorBlinkRate`, `revealMode`, `fontSize`, `padding`, `showScanlines`, `showLineNumbers` |
| Audio | `audioTrackId`, `audioVolume` |
| Export | `isExporting`, `exportProgress`, `exportStage` |

---

### 6. Audio Library (`src/config/audioTracks.ts` + `scripts/gen-audio.cjs`)

Five ambient MP3 tracks live in `public/audio/`. The `scripts/gen-audio.cjs` helper can generate placeholder WAV versions using pure Node.js math (no external dependencies):

| Track | File | Synthesis technique |
|-------|------|---------------------|
| Code Chill | `code-chill.mp3` | Pink noise (Paul Kellet's filter) |
| Good Night | `good-night.mp3` | Louder pink noise |
| Mirostar | `mirostar.mp3` | Cafe-style: C4/E4/G4 sine chords + tremolo + white noise |
| Pulsebox | `pulsebox.mp3` | Sci-Fi drone: stacked sine harmonics at 55 Hz |
| The Mountain | `the_mountain.mp3` | High-frequency oscillators (3.2–4.2 kHz) + pink noise |

Tracks are looped programmatically during export — no seamless-loop editing required.

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | **React 19** + Vite 8 | Latest React features, fast HMR |
| Language | **TypeScript 6** | End-to-end type safety |
| Styling | **TailwindCSS v4** + Vanilla CSS | Utility classes + custom design tokens |
| State | **Zustand** | Minimal boilerplate, reactive global store |
| Syntax HL | **Shiki** (WASM) | VS Code–grade token colours, browser-native |
| Video encode | **WebCodecs API** — `VideoEncoder` | Native H.264 encoding, zero server |
| MP4 container | **mp4-muxer** | Pure JS, correct `moov` metadata, in-memory |
| Audio encode | **WebCodecs API** — `AudioEncoder` | Native AAC-LC, no FFmpeg WASM |
| Audio playback | **Howler.js** | Preview playback in the UI |
| Notifications | **react-hot-toast** | Non-intrusive status toasts |
| Icons | **Lucide React** | Consistent SVG icon set |

---

## 📁 Project Structure

```
neonsnip/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions → GitHub Pages CI/CD
├── public/
│   ├── audio/                  # Ambient MP3 tracks (code-chill, good-night, …)
│   ├── favicon.svg
│   ├── icons.svg
│   └── logo.png
├── scripts/
│   └── gen-audio.cjs           # Node.js script to generate placeholder WAV audio
├── src/
│   ├── components/
│   │   ├── TopBar.tsx           # Header — branding + GitHub link
│   │   ├── CodeInput.tsx        # Code textarea + language selector dropdown
│   │   ├── ThemeSelector.tsx    # Theme picker + accent hue slider
│   │   ├── AnimationConfig.tsx  # Speed, font size, cursor style, reveal mode, scanlines
│   │   ├── AudioLibrary.tsx     # Track picker + live preview playback (Howler.js)
│   │   ├── ExportPanel.tsx      # Export button, progress bar, stats display
│   │   └── CanvasPreview.tsx    # Live 9:16 canvas (forwardRef → useCanvasRenderer)
│   ├── config/
│   │   └── audioTracks.ts       # Audio track manifest (id, name, url, icon)
│   ├── hooks/
│   │   ├── useCanvasRenderer.ts # requestAnimationFrame live preview loop
│   │   └── useExport.ts         # Full WebCodecs → mp4-muxer export pipeline
│   ├── store/
│   │   └── useStore.ts          # Zustand global state (all config + export state)
│   ├── themes/
│   │   └── themes.ts            # Theme definitions (shikiTheme, bgColor, cursorColor, glow)
│   ├── utils/
│   │   ├── assetUrl.ts          # Resolves public/ paths relative to Vite base (/NeonSnip/)
│   │   ├── canvasLayout.ts      # Layout calc, token wrapping, cursor finding, scroll, draw
│   │   ├── tokenizer.ts         # Shiki wrapper — lazy-loads highlighter once, caches it
│   │   ├── typewriterEngine.ts  # Pure deterministic char/line reveal calculator
│   │   └── ffmpegEncoder.ts     # Legacy FFmpeg/WASM muxer — kept for reference, not used
│   ├── App.tsx                  # Root layout (3-column grid), canvas ref, export handler
│   ├── index.css                # Global CSS variables, panel styles, scrollbar overrides
│   └── main.tsx                 # React entry point
├── index.html                   # HTML shell — JetBrains Mono font, root div
├── vite.config.ts               # COOP/COEP headers, /NeonSnip/ base, ffmpeg exclusions
├── tailwind.config.ts           # TailwindCSS v4 config
├── postcss.config.js            # @tailwindcss/postcss plugin
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
└── eslint.config.js
```

---

## ⚙️ Configuration Reference

### Animation

| Setting | Range / Options | Default | Description |
|---------|----------------|---------|-------------|
| Speed (WPM) | 30 – 400 | 150 | Typing speed in words per minute |
| Font Size | 20 – 80 px | 40 px | Code font size on the 1080 px canvas |
| Padding | any | 60 px | Canvas edge padding |
| Cursor Style | `block` / `line` / `underscore` | `block` | Shape of the blinking cursor |
| Cursor Blink Rate | ms | 500 ms | How fast the cursor blinks |
| Reveal Mode | `char` / `line` | `char` | Reveal character-by-character or full lines |
| Scanlines | on / off | on | Retro CRT horizontal line overlay |
| Line Numbers | on / off | on | Show gutter line numbers |

### Themes

| Theme ID | Shiki Base | Background | Cursor / Glow |
|----------|-----------|-----------|----------------|
| `neon-tokyo` | `dracula` | `#09090b` (zinc-950) | Rose — `#f43f5e` |
| `acid-purple` | `synthwave-84` | `#1e013f` (deep purple) | Fuchsia — `#d946ef` |
| `hacker-green` | `monokai` | `#020617` (slate-950) | Green — `#22c55e` |
| `midnight-blue` | `nord` | `#0f172a` (slate-900) | Sky — `#38bdf8` |

The **Accent Hue** slider (0°–360°) overrides the cursor and glow colour in real-time without changing the syntax highlight scheme.

---

## 🌐 Deployment

### GitHub Pages (automated — included in this repo)

Push to `main` — the [deploy.yml](.github/workflows/deploy.yml) workflow runs `npm run build` and publishes `./dist` to the `gh-pages` branch automatically.

The Vite `base` is set to `/NeonSnip/` in `vite.config.ts`, so all asset URLs are correct on GitHub Pages out of the box.

### Other Hosts

NeonSnip requires two HTTP response headers to enable **SharedArrayBuffer** (needed by WebCodecs and OffscreenCanvas):

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

**Vercel** — add `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" },
        { "key": "Cross-Origin-Embedder-Policy", "value": "require-corp" }
      ]
    }
  ]
}
```

**Netlify** — add `netlify.toml`:
```toml
[[headers]]
  for = "/*"
  [headers.values]
    Cross-Origin-Opener-Policy = "same-origin"
    Cross-Origin-Embedder-Policy = "require-corp"
```

**Nginx**:
```nginx
add_header Cross-Origin-Opener-Policy "same-origin" always;
add_header Cross-Origin-Embedder-Policy "require-corp" always;
```

> These headers are set automatically in the Vite dev server via `vite.config.ts` — you don't need to do anything locally.

---

## 🔒 Browser Requirements

| API | Minimum version |
|-----|----------------|
| `VideoEncoder` (WebCodecs) | Chrome 94+ · Edge 94+ |
| `AudioEncoder` (WebCodecs) | Chrome 94+ · Edge 94+ |
| `OffscreenCanvas` | Chrome 69+ · Edge 79+ |
| `AudioContext` | All modern browsers |

> Firefox does not yet support `VideoEncoder`. Safari support is partial.  
> **Chrome or Edge is required for the export feature.**

---

## 📄 License

MIT — free to use, modify, fork, and deploy.

---

*Built with React 19, WebCodecs, Shiki, and a lot of canvas math.*
