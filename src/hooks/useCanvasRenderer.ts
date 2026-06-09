import { useEffect, useRef, useState, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { getTheme } from '../themes/themes';
import { tokenize } from '../utils/tokenizer';
import { calculateVisibleContent } from '../utils/typewriterEngine';
import {
  getCanvasLayout,
  findCharModeCursor,
  findLineModeCursor,
  computeScrollOffset,
  buildDrawableVisualLines,
  drawVisualLines,
} from '../utils/canvasLayout';
import type { ThemedToken } from 'shiki';

export const useCanvasRenderer = (canvasRef: React.RefObject<HTMLCanvasElement | null>) => {
  const store = useStore();
  const requestRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const [tokens, setTokens] = useState<ThemedToken[][]>([]);

  useEffect(() => {
    let active = true;
    const themeDef = getTheme(store.themeId);
    tokenize(store.code, store.language, themeDef.shikiTheme).then(res => {
      if (active) {
        setTokens(res);
        startTimeRef.current = performance.now();
      }
    });
    return () => { active = false; };
  }, [store.code, store.language, store.themeId]);

  useEffect(() => {
    startTimeRef.current = performance.now();
  }, [store.typingSpeedWpm, store.revealMode]);

  const drawFrame = useCallback((time: number) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    if (!startTimeRef.current) {
      startTimeRef.current = time;
    }

    const elapsedMs = time - startTimeRef.current;
    const themeDef = getTheme(store.themeId);

    const width = 1080;
    const height = 1920;
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = themeDef.backgroundColor;
    ctx.fillRect(0, 0, width, height);

    if (store.showScanlines) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      for (let i = 0; i < height; i += 4) {
        ctx.fillRect(0, i, width, 1);
      }
    }

    const layout = getCanvasLayout(width, height, store.fontSize, store.padding, store.showLineNumbers);
    ctx.font = `${store.fontSize}px "JetBrains Mono", monospace`;
    ctx.textBaseline = 'top';

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    ctx.clip();

    let totalChars = 0;
    tokens.forEach(line => {
      line.forEach(t => totalChars += t.content.length);
      totalChars += 1;
    });

    const visibleData = calculateVisibleContent({
      elapsedMs,
      wpm: store.typingSpeedWpm,
      revealMode: store.revealMode,
      totalCharsInCode: totalChars,
      totalLinesInCode: tokens.length,
    }, tokens);

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
      0.7,
    );

    ctx.shadowBlur = 0;
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

    const showCursor = !isFinished || (Math.floor(elapsedMs / store.cursorBlinkRate) % 2 === 0);

    if (showCursor) {
      const cursorY = cursor.y - scrollOffsetY;
      ctx.shadowBlur = themeDef.glowIntensity;
      ctx.shadowColor = themeDef.cursorColor;
      ctx.fillStyle = themeDef.cursorColor;

      if (store.cursorStyle === 'block') {
        ctx.fillRect(cursor.x, cursorY + 2, store.fontSize * 0.6, store.fontSize * 1.1);
      } else if (store.cursorStyle === 'line') {
        ctx.fillRect(cursor.x, cursorY, 2, store.fontSize * 1.2);
      } else if (store.cursorStyle === 'underscore') {
        ctx.fillRect(cursor.x, cursorY + store.fontSize * 1.2, store.fontSize * 0.6, 2);
      }
    }

    ctx.restore();

    if (!store.isExporting) {
      requestRef.current = requestAnimationFrame(drawFrame);
    }
  }, [canvasRef, store, tokens]);

  useEffect(() => {
    if (!store.isExporting) {
      requestRef.current = requestAnimationFrame(drawFrame);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [tokens, store.isExporting, drawFrame]);

  return { tokens };
};
