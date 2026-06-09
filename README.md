# 🎬 NeonSnip: Code-to-Reel Animator

> Turn your code into a stunning vertical short-form video — no server, no account, no upload. Everything happens in your browser.

![NeonSnip Banner](https://img.shields.io/badge/NeonSnip-Code--to--Reel-blueviolet?style=for-the-badge&logo=film)
![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

---

## ✨ What is NeonSnip?

NeonSnip lets you paste any code snippet and export it as a **9:16 vertical MP4 video** (1080×1920 — perfect for TikTok, YouTube Shorts, Instagram Reels) where:

- The code **types itself out** character-by-character or line-by-line
- A blinking **cursor** moves along as it types
- Everything is overlaid on a **high-contrast dark theme** with optional neon glow
- An **ambient audio track** is baked into the exported video
- The output is a real **H.264 MP4 file** — ready to upload anywhere

**Zero server. Zero upload. Zero subscription.**

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Generate the ambient audio tracks (run once)
node scripts/gen-audio.cjs

# Start the dev server
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173).

> **Build for production:**
> ```bash
> npm run build
> ```

---

## 🏗️ How It Works — Under the Hood

### 1. Code Input & Syntax Highlighting

When you paste code into the editor panel, NeonSnip sends it to **[Shiki](https://shiki.style/)** — the same VS Code-grade tokenizer used in VS Code itself. Shiki runs entirely in the browser via WebAssembly and returns an array of **themed tokens**: each character grouped with its exact hex colour according to the chosen theme (Dracula, Synthwave 84, Monokai, Nord, etc.).

```
Code string → Shiki WASM → ThemedToken[][] (per line, per token with colour)
```

### 2. Typewriter Engine

The `typewriterEngine.ts` module is a **pure function** (no side effects, no timers). It takes:

- `elapsedMs` — how many milliseconds have passed since the animation started
- `wpm` — the typing speed set by the user (words per minute)
- `revealMode` — `"char"` (one character at a time) or `"line"` (one full line at a time)
- The full token array

And returns `{ charsToReveal, linesToReveal }` — exactly how many characters (or lines) should be visible at that point in time. This deterministic design means the **exact same frame is produced for the exact same timestamp** every time, which is critical for reliable video export.

### 3. Canvas Renderer

The live preview and the export both use the same rendering function. It:

1. **Clears** the canvas (`1080×1920` pixels)
2. **Fills** the background with the theme's background colour
3. Optionally draws **scanlines** (subtle horizontal lines for a retro CRT look)
4. Loops through the token array, drawing only the tokens that `charsToReveal` allows using `ctx.fillText()`
5. Calculates the **cursor position** (pixel-exact based on `ctx.measureText()`)
6. **Auto-scrolls** — when the cursor passes 65% of the canvas height, everything shifts up so the cursor stays in view
7. Draws the **cursor** (block / line / underscore, with configurable neon glow via `ctx.shadowBlur`)

For the **live preview**, this runs inside a `requestAnimationFrame` loop via the `useCanvasRenderer` hook, updating ~60 times per second.

### 4. Export Pipeline — Canvas → MP4

This is where NeonSnip does something unusual. Instead of using a server or FFmpeg, the entire encoding pipeline runs in the browser using the **WebCodecs API** (Chrome 94+):

```
OffscreenCanvas frames
    ↓
VideoEncoder (H.264 / AVC High Profile Level 5.1)
    ↓
mp4-muxer (pure JS MP4 container)
    ↓  (if audio selected)
AudioEncoder (AAC-LC)
    ↓
neonsnip_export.mp4  ← downloaded to your device
```

**Step-by-step:**

1. **Frame rendering loop** — For each of the `totalFrames` (calculated from typing speed × code length + 2s tail), NeonSnip draws the frame for that exact timestamp onto an `OffscreenCanvas` (invisible, never shown to the user)

2. **VideoEncoder** — Each canvas frame is passed to the browser's native `VideoEncoder` as a `VideoFrame`. The encoder compresses it to H.264 at 8 Mbps. A keyframe is inserted every 2 seconds.

3. **mp4-muxer** — As encoded chunks come out of VideoEncoder, they are fed to `mp4-muxer` which assembles them into a valid MP4 container with correct duration metadata, timecodes and moov atom structure.

4. **Audio (optional)** — If you selected an audio track:
   - The WAV file is fetched from `/audio/`
   - Decoded with `AudioContext.decodeAudioData()`
   - Looped programmatically to match the video duration
   - Encoded to AAC-LC with `AudioEncoder`
   - Added to the muxer as a second track

5. **Download** — `muxer.finalize()` is called, the resulting `ArrayBuffer` is wrapped in a `Blob`, a temporary object URL is created, and a hidden `<a>` tag triggers the browser's native download.

### 5. Audio Library

Five ambient audio tracks are included, generated locally by `scripts/gen-audio.cjs` using pure math (no external dependencies):

| Track | Type | How it's made |
|-------|------|---------------|
| Rain on Roof | Pink noise | Paul Kellet's pink noise filter |
| Thunderstorm | Louder pink noise | Same filter, higher amplitude |
| Cafe Ambience | Chord + noise | Sine waves (C4/E4/G4) + tremolo + white noise |
| Sci-Fi Hum | Drone | Stacked sine harmonics at 55Hz + subtle noise |
| Summer Ambience | Cricket-like | High-frequency oscillators (3.2–4.2kHz) + pink noise |

All tracks are 30-second WAV files that loop seamlessly during export.

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | React 18 + Vite | Fast HMR, modern React features |
| Language | TypeScript | Type safety across the entire pipeline |
| Styling | TailwindCSS v4 | Utility-first, minimal custom CSS |
| State | Zustand | Minimal boilerplate, reactive store |
| Syntax HL | Shiki | VS Code-grade themes, WASM-powered |
| Video encode | WebCodecs API (VideoEncoder) | Native H.264 encoding, no server |
| MP4 mux | mp4-muxer | Pure JS, no WASM, correct duration metadata |
| Audio | Web Audio API + AudioEncoder | Native AAC encoding, no dependencies |
| Notifications | react-hot-toast | Non-intrusive toasts |

---

## 📁 Project Structure

```
neonsnip/
├── public/
│   └── audio/                  # Generated WAV ambient tracks (track1-5.wav)
├── scripts/
│   └── gen-audio.cjs           # Node.js script to regenerate audio tracks
├── src/
│   ├── components/
│   │   ├── TopBar.tsx           # App header with branding
│   │   ├── CodeInput.tsx        # Code textarea + language selector
│   │   ├── ThemeSelector.tsx    # Theme picker + accent hue slider
│   │   ├── AnimationConfig.tsx  # Speed, font size, cursor, reveal mode
│   │   ├── AudioLibrary.tsx     # Track picker + preview playback
│   │   ├── ExportPanel.tsx      # Export button + progress bar
│   │   └── CanvasPreview.tsx    # Live 9:16 canvas preview (forwardRef)
│   ├── hooks/
│   │   ├── useCanvasRenderer.ts # requestAnimationFrame live preview loop
│   │   └── useExport.ts         # Full VideoEncoder → mp4-muxer pipeline
│   ├── store/
│   │   └── useStore.ts          # Zustand global state
│   ├── themes/
│   │   └── themes.ts            # Theme definitions (colours, glow, cursor)
│   ├── utils/
│   │   ├── tokenizer.ts         # Shiki wrapper (lazy-loads highlighter)
│   │   ├── typewriterEngine.ts  # Deterministic char/line reveal calculator
│   │   └── ffmpegEncoder.ts     # (Legacy — unused, kept for reference)
│   ├── App.tsx                  # Root layout, ref wiring, export handler
│   ├── main.tsx                 # React entry point
│   └── index.css               # Global styles + Tailwind import
├── vite.config.ts              # COOP/COEP headers, dependency exclusions
└── postcss.config.js           # @tailwindcss/postcss plugin
```

---

## ⚙️ Configuration Options

### Animation Config
| Setting | Range | Description |
|---------|-------|-------------|
| Speed (WPM) | 30–400 | How fast the code types out |
| Font Size | 20–80px | Code text size on the 1080px canvas |
| Cursor Style | Block / Line / Underscore | Shape of the blinking cursor |
| Reveal Mode | By Character / By Line | Whether to reveal char-by-char or full lines |
| Scanlines | On/Off | Retro CRT scanline overlay |
| Line Numbers | On/Off | Gutter line numbers |

### Themes
| Theme | Shiki Base | Accent |
|-------|-----------|--------|
| Neon Tokyo | `tokyo-night` | Purple |
| Hacker Green | `github-dark` | Green |
| Acid Purple | `synthwave-84` | Pink/Purple |
| Midnight Blue | `night-owl` | Blue |

The **Accent Hue** slider (0°–360°) overrides the cursor and glow colour in real-time.

---

## 🌐 Deployment

NeonSnip requires two HTTP headers to use the WebCodecs API and OffscreenCanvas. Add these to your host config:

### Vercel (`vercel.json`)
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

### Netlify (`netlify.toml`)
```toml
[[headers]]
  for = "/*"
  [headers.values]
    Cross-Origin-Opener-Policy = "same-origin"
    Cross-Origin-Embedder-Policy = "require-corp"
```

### Nginx
```nginx
add_header Cross-Origin-Opener-Policy "same-origin";
add_header Cross-Origin-Embedder-Policy "require-corp";
```

> **Note:** These headers are already set automatically in the Vite dev server via `vite.config.ts`.

---

## 🔒 Browser Requirements

| Feature | Minimum Version |
|---------|----------------|
| `VideoEncoder` (WebCodecs) | Chrome 94+ / Edge 94+ |
| `OffscreenCanvas` | Chrome 69+ / Edge 79+ |
| `AudioEncoder` | Chrome 94+ / Edge 94+ |
| `MediaRecorder` | All modern browsers |

> Firefox does not yet support `VideoEncoder`. Safari support is partial. **Chrome is recommended.**

---

## 📄 License

MIT — free to use, modify, and deploy.

---

*Built with ❤️ using React, WebCodecs, and a lot of canvas math.*
