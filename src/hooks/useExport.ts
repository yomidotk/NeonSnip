import { useStore } from '../store/useStore';
import toast from 'react-hot-toast';
import { getTheme } from '../themes/themes';
import { calculateVisibleContent, getTotalDurationMs } from '../utils/typewriterEngine';
import { tokenize } from '../utils/tokenizer';
import {
  getCanvasLayout,
  findCharModeCursor,
  findLineModeCursor,
  computeScrollOffset,
  buildDrawableVisualLines,
  drawVisualLines,
} from '../utils/canvasLayout';

const TRACKS = [
  { id: 'lofi-1', name: 'Rain on Roof', url: '/audio/track1.wav' },
  { id: 'lofi-2', name: 'Thunderstorm', url: '/audio/track2.wav' },
  { id: 'lofi-3', name: 'Cafe Ambience', url: '/audio/track3.wav' },
  { id: 'lofi-4', name: 'Sci-Fi Hum', url: '/audio/track4.wav' },
  { id: 'lofi-5', name: 'Summer Ambience', url: '/audio/track5.wav' },
];

const FPS = 30;
const VIDEO_WIDTH = 1080;
const VIDEO_HEIGHT = 1920;

export const useExport = (canvasRef: React.RefObject<HTMLCanvasElement | null>) => {
  const store = useStore();

  const handleExport = async () => {
    if (!canvasRef.current) {
      toast.error('Canvas not ready. Please wait a moment and try again.');
      return;
    }
    // ── Check WebCodecs support ──────────────────────────────────────────────
    if (typeof (window as any).VideoEncoder === 'undefined') {
      toast.error('VideoEncoder not supported. Please use Chrome 94+ or Edge 94+.');
      return;
    }

    store.setExportState(true, 0, 'Tokenizing code...');

    const themeDef = getTheme(store.themeId);
    let tokens: any[][];
    try {
      tokens = await tokenize(store.code, store.language, themeDef.shikiTheme);
    } catch (e: any) {
      toast.error('Tokenization failed: ' + e.message);
      store.setExportState(false, 0, '');
      return;
    }

    let totalChars = 0;
    tokens.forEach(line => {
      line.forEach(t => (totalChars += t.content.length));
      totalChars += 1; // newline
    });

    const totalDurationMs = getTotalDurationMs(totalChars, store.typingSpeedWpm);
    // Add 2s tail where cursor blinks
    const totalDurationWithTail = totalDurationMs + 2000;
    const totalFrames = Math.ceil((totalDurationWithTail / 1000) * FPS);

    // ── Set up mp4-muxer ─────────────────────────────────────────────────────
    const { Muxer, ArrayBufferTarget } = await import('mp4-muxer');
    const track = TRACKS.find(t => t.id === store.audioTrackId);

    const muxer = new Muxer({
      target: new ArrayBufferTarget(),
      video: {
        codec: 'avc',
        width: VIDEO_WIDTH,
        height: VIDEO_HEIGHT,
        frameRate: FPS,
      },
      ...(track
        ? { audio: { codec: 'aac', sampleRate: 44100, numberOfChannels: 1 } }
        : {}),
      fastStart: 'in-memory',
    });

    // ── Set up VideoEncoder ──────────────────────────────────────────────────
    let videoEncodeError: Error | null = null;
    const videoEncoder = new (window as any).VideoEncoder({
      output: (chunk: any, meta: any) => muxer.addVideoChunk(chunk, meta),
      error: (e: any) => { videoEncodeError = e; },
    });

    videoEncoder.configure({
      codec: 'avc1.640033', // H.264 High Profile Level 5.1 — supports up to 4K
      width: VIDEO_WIDTH,
      height: VIDEO_HEIGHT,
      bitrate: 8_000_000,
      framerate: FPS,
      latencyMode: 'quality',
    });

    // ── Render & encode each frame ───────────────────────────────────────────
    store.setExportState(true, 2, 'Encoding frames...');

    // Use an offscreen canvas so we don't disturb the live preview
    const offscreen = new OffscreenCanvas(VIDEO_WIDTH, VIDEO_HEIGHT);
    const offCtx = offscreen.getContext('2d')!;

    for (let frame = 0; frame <= totalFrames; frame++) {
      if (videoEncodeError) {
        toast.error('Video encoding error: ' + (videoEncodeError as any).message);
        store.setExportState(false, 0, '');
        return;
      }

      const elapsedMs = (frame / FPS) * 1000;
      renderFrameToCtx(offCtx, offscreen.width, offscreen.height, elapsedMs, tokens, totalChars, themeDef, store);

      const timestampUs = Math.round((frame / FPS) * 1_000_000);
      const videoFrame = new (window as any).VideoFrame(offscreen, {
        timestamp: timestampUs,
        duration: Math.round(1_000_000 / FPS),
      });

      videoEncoder.encode(videoFrame, { keyFrame: frame % (FPS * 2) === 0 });
      videoFrame.close();

      // Update progress (0-70%) and yield to browser every 5 frames
      if (frame % 5 === 0) {
        const pct = Math.round((frame / totalFrames) * 70);
        store.setExportState(true, pct, `Encoding frame ${frame}/${totalFrames}...`);
        await new Promise(r => setTimeout(r, 0));
      }
    }

    await videoEncoder.flush();
    videoEncoder.close();

    // ── Encode audio ─────────────────────────────────────────────────────────
    if (track && typeof (window as any).AudioEncoder !== 'undefined' && typeof (window as any).AudioData !== 'undefined') {
      store.setExportState(true, 72, 'Processing audio...');
      try {
        const arrayBuf = await Promise.race([
          fetch(track.url).then(r => r.arrayBuffer()),
          new Promise<never>((_, rej) => setTimeout(() => rej(new Error('fetch timeout')), 12_000)),
        ]) as ArrayBuffer;

        const audioCtx = new AudioContext({ sampleRate: 44100 });
        const audioBuf = await audioCtx.decodeAudioData(arrayBuf);
        await audioCtx.close();

        const sampleRate = 44100;
        const totalSamples = Math.ceil((totalDurationWithTail / 1000) * sampleRate);
        const srcData = audioBuf.getChannelData(0);
        const looped = new Float32Array(totalSamples);
        for (let i = 0; i < totalSamples; i++) looped[i] = srcData[i % srcData.length];

        // Encode audio in a worker-like pattern: resolve when all frames flushed
        const audioChunks: { chunk: any; meta: any }[] = [];

        await new Promise<void>((resolveAudio, rejectAudio) => {
          // Safety abort after 15s
          const abort = setTimeout(() => rejectAudio(new Error('Audio encode timeout')), 15_000);

          const audioEncoder = new (window as any).AudioEncoder({
            output: (chunk: any, meta: any) => audioChunks.push({ chunk, meta }),
            error: (e: any) => { clearTimeout(abort); rejectAudio(e); },
          });

          audioEncoder.configure({ codec: 'mp4a.40.2', sampleRate, numberOfChannels: 1, bitrate: 128_000 });

          const CHUNK = 4096;
          for (let i = 0; i < totalSamples; i += CHUNK) {
            const slice = looped.slice(i, Math.min(i + CHUNK, totalSamples));
            const af = new (window as any).AudioData({
              format: 'f32', sampleRate, numberOfFrames: slice.length,
              numberOfChannels: 1, timestamp: Math.round((i / sampleRate) * 1_000_000), data: slice,
            });
            audioEncoder.encode(af);
            af.close();
          }

          // flush() resolves when all frames are output
          audioEncoder.flush().then(() => {
            audioEncoder.close();
            clearTimeout(abort);
            resolveAudio();
          }).catch((e: any) => { clearTimeout(abort); rejectAudio(e); });
        });

        for (const { chunk, meta } of audioChunks) muxer.addAudioChunk(chunk, meta);
        store.setExportState(true, 90, 'Finalizing MP4...');
      } catch (audioErr) {
        console.warn('Audio skipped:', audioErr);
        toast('Audio skipped — video exported without sound.', { icon: '⚠️' });
      }
    }

    // ── Finalize & download ──────────────────────────────────────────────────
    store.setExportState(true, 95, 'Writing MP4 file...');
    muxer.finalize();

    const { buffer } = (muxer.target as any);
    const mp4Blob = new Blob([buffer], { type: 'video/mp4' });

    const url = URL.createObjectURL(mp4Blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'neonsnip_export.mp4';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10_000);

    store.setExportState(false, 0, '');
  };

  return { handleExport };
};

// ─── Offscreen frame renderer ─────────────────────────────────────────────────
function renderFrameToCtx(
  ctx: OffscreenCanvasRenderingContext2D,
  width: number,
  height: number,
  elapsedMs: number,
  tokens: any[][],
  totalChars: number,
  themeDef: any,
  store: any
) {
  const fontSize: number = store.fontSize ?? 40;
  const padding: number = store.padding ?? 60;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = themeDef.backgroundColor ?? '#0d0d1a';
  ctx.fillRect(0, 0, width, height);

  if (store.showScanlines) {
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    for (let i = 0; i < height; i += 4) ctx.fillRect(0, i, width, 1);
  }

  const layout = getCanvasLayout(width, height, fontSize, padding, store.showLineNumbers, 1.5);
  ctx.font = `${fontSize}px "JetBrains Mono", Menlo, monospace`;
  ctx.textBaseline = 'top';

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, width, height);
  ctx.clip();

  const visibleData = calculateVisibleContent(
    {
      elapsedMs,
      wpm: store.typingSpeedWpm,
      revealMode: store.revealMode,
      totalCharsInCode: totalChars,
      totalLinesInCode: tokens.length,
    },
    tokens
  );

  const visualLines = buildDrawableVisualLines(
    ctx,
    tokens,
    layout,
    store.revealMode,
    visibleData.charsToReveal,
    visibleData.linesToReveal,
  );

  const cursor = store.revealMode === 'char' && visibleData.charsToReveal !== undefined
    ? findCharModeCursor(ctx, tokens, visibleData.charsToReveal, layout)
    : findLineModeCursor(ctx, tokens, visibleData.linesToReveal ?? 0, layout);

  const lastVisualLineY = visualLines.length > 0
    ? layout.padding + (visualLines.length - 1) * layout.lineHeight
    : layout.padding;

  const scrollOffsetY = computeScrollOffset(
    cursor.y,
    lastVisualLineY,
    height,
    layout.padding,
    layout.lineHeight,
    0.65,
  );

  drawVisualLines(
    ctx,
    visualLines,
    layout,
    scrollOffsetY,
    store.showLineNumbers,
    (sourceLineIndex) => sourceLineIndex + 1,
  );

  const isFinished =
    (store.revealMode === 'char' && visibleData.charsToReveal !== undefined && visibleData.charsToReveal >= totalChars) ||
    (store.revealMode === 'line' && visibleData.linesToReveal !== undefined && visibleData.linesToReveal >= tokens.length);
  const blinkOn = Math.floor(elapsedMs / (store.cursorBlinkRate ?? 530)) % 2 === 0;

  if (!isFinished || blinkOn) {
    const cursorY = cursor.y - scrollOffsetY;
    ctx.shadowBlur = themeDef.glowIntensity ?? 8;
    ctx.shadowColor = themeDef.cursorColor ?? '#a855f7';
    ctx.fillStyle = themeDef.cursorColor ?? '#a855f7';
    if (store.cursorStyle === 'line') {
      ctx.fillRect(cursor.x, cursorY, 2, layout.lineHeight);
    } else if (store.cursorStyle === 'underscore') {
      ctx.fillRect(cursor.x, cursorY + layout.lineHeight - 3, fontSize * 0.6, 3);
    } else {
      ctx.fillRect(cursor.x, cursorY, fontSize * 0.55, layout.lineHeight);
    }
    ctx.shadowBlur = 0;
  }

  ctx.restore();
}
