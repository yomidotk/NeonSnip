import type { ThemedToken } from 'shiki';

export interface CanvasLayout {
  fontSize: number;
  padding: number;
  lineHeight: number;
  lineNumberWidth: number;
  codeStartX: number;
  maxLineWidth: number;
  contentHeight: number;
}

export function getCanvasLayout(
  width: number,
  height: number,
  fontSize: number,
  padding: number,
  showLineNumbers: boolean,
  lineHeightMultiplier = 1.5,
): CanvasLayout {
  const lineHeight = fontSize * lineHeightMultiplier;
  const lineNumberWidth = showLineNumbers ? fontSize * 3 : 0;
  const codeStartX = padding + lineNumberWidth;
  const maxLineWidth = width - padding * 2 - lineNumberWidth;

  return {
    fontSize,
    padding,
    lineHeight,
    lineNumberWidth,
    codeStartX,
    maxLineWidth,
    contentHeight: height - padding * 2,
  };
}

export function clampText(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  text: string,
  maxW: number,
): string {
  if (maxW <= 0 || text.length === 0) return '';
  if (ctx.measureText(text).width <= maxW) return text;

  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (ctx.measureText(text.slice(0, mid)).width <= maxW) lo = mid;
    else hi = mid - 1;
  }
  return text.slice(0, lo);
}

export interface VisualLine {
  tokens: { text: string; color?: string }[];
  sourceLineIndex: number;
}

export function wrapTokensToVisualLines(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  lineTokens: ThemedToken[],
  maxLineWidth: number,
  sourceLineIndex: number,
): VisualLine[] {
  if (maxLineWidth <= 0) return [];

  const visualLines: VisualLine[] = [];
  let current: { text: string; color?: string }[] = [];
  let currentWidth = 0;

  const pushCurrent = () => {
    if (current.length > 0) {
      visualLines.push({ tokens: current, sourceLineIndex });
      current = [];
      currentWidth = 0;
    }
  };

  for (const token of lineTokens) {
    let remaining = token.content;
    const color = token.color;

    while (remaining.length > 0) {
      const spaceLeft = maxLineWidth - currentWidth;

      if (spaceLeft <= 0) {
        pushCurrent();
        continue;
      }

      const segment = clampText(ctx, remaining, spaceLeft);
      if (segment.length === 0) {
        pushCurrent();
        continue;
      }

      current.push({ text: segment, color });
      currentWidth += ctx.measureText(segment).width;
      remaining = remaining.slice(segment.length);

      if (remaining.length > 0) pushCurrent();
    }
  }

  pushCurrent();
  return visualLines.length > 0 ? visualLines : [{ tokens: [], sourceLineIndex }];
}

export interface CursorState {
  x: number;
  y: number;
  activeSourceLine: number;
  activeVisualLine: number;
}

export function findCharModeCursor(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  tokens: ThemedToken[][],
  charsToReveal: number,
  layout: CanvasLayout,
): CursorState {
  const { padding, lineHeight, codeStartX, maxLineWidth } = layout;
  let sourceChars = 0;
  let visualLineIndex = 0;

  for (let sourceLine = 0; sourceLine < tokens.length; sourceLine++) {
    const lineLen = tokens[sourceLine].reduce((sum, token) => sum + token.content.length, 0);
    const lineStart = sourceChars;
    const lineEnd = sourceChars + lineLen;
    const lineEndWithNewline = lineEnd + 1;
    const visualLines = wrapTokensToVisualLines(ctx, tokens[sourceLine], maxLineWidth, sourceLine);

    const cursorOnLine =
      charsToReveal <= lineEnd ||
      (charsToReveal < lineEndWithNewline) ||
      (sourceLine === tokens.length - 1 && charsToReveal >= lineEnd);

    if (cursorOnLine) {
      const charsOnLine = Math.min(Math.max(0, charsToReveal - lineStart), lineLen);
      let consumed = 0;
      let cursorX = codeStartX;
      let cursorY = padding + visualLineIndex * lineHeight;
      let activeVisualLine = visualLineIndex;

      for (const visualLine of visualLines) {
        let lineText = '';
        let lineChars = 0;
        for (const part of visualLine.tokens) {
          lineText += part.text;
          lineChars += part.text.length;
        }

        if (consumed + lineChars >= charsOnLine) {
          const charsIntoVisual = charsOnLine - consumed;
          let built = '';
          let idx = 0;
          for (const part of visualLine.tokens) {
            if (idx + part.text.length <= charsIntoVisual) {
              built += part.text;
              idx += part.text.length;
            } else {
              built += part.text.slice(0, charsIntoVisual - idx);
              break;
            }
          }
          cursorX = codeStartX + ctx.measureText(built).width;
          cursorY = padding + activeVisualLine * lineHeight;
          break;
        }

        consumed += lineChars;
        activeVisualLine += 1;
      }

      return {
        x: Math.min(cursorX, codeStartX + maxLineWidth),
        y: cursorY,
        activeSourceLine: sourceLine,
        activeVisualLine,
      };
    }

    sourceChars = lineEndWithNewline;
    visualLineIndex += visualLines.length;
  }

  return {
    x: codeStartX,
    y: padding,
    activeSourceLine: 0,
    activeVisualLine: 0,
  };
}

export function findLineModeCursor(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  tokens: ThemedToken[][],
  linesToReveal: number,
  layout: CanvasLayout,
): CursorState {
  const { padding, lineHeight, codeStartX, maxLineWidth } = layout;
  const activeSourceLine = Math.min(linesToReveal, Math.max(0, tokens.length - 1));

  let visualLineIndex = 0;
  for (let i = 0; i < activeSourceLine; i++) {
    visualLineIndex += wrapTokensToVisualLines(ctx, tokens[i], maxLineWidth, i).length;
  }

  return {
    x: codeStartX,
    y: padding + visualLineIndex * lineHeight,
    activeSourceLine,
    activeVisualLine: visualLineIndex,
  };
}

export function computeScrollOffset(
  cursorY: number,
  lastVisualLineY: number,
  height: number,
  padding: number,
  lineHeight: number,
  anchorRatio = 0.65,
): number {
  const scrollAnchorY = height * anchorRatio - lineHeight;
  const scrollForCursor = Math.max(0, cursorY - scrollAnchorY);
  const scrollForBottom = Math.max(0, lastVisualLineY + lineHeight - (height - padding));
  return Math.max(scrollForCursor, scrollForBottom);
}

function sliceVisualLineByChars(
  visualLine: VisualLine,
  charsToInclude: number,
): VisualLine {
  if (charsToInclude <= 0) return { tokens: [], sourceLineIndex: visualLine.sourceLineIndex };

  const sliced: { text: string; color?: string }[] = [];
  let remaining = charsToInclude;

  for (const part of visualLine.tokens) {
    if (remaining <= 0) break;
    if (part.text.length <= remaining) {
      sliced.push(part);
      remaining -= part.text.length;
    } else {
      sliced.push({ text: part.text.slice(0, remaining), color: part.color });
      remaining = 0;
    }
  }

  return { tokens: sliced, sourceLineIndex: visualLine.sourceLineIndex };
}

export function buildDrawableVisualLines(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  tokens: ThemedToken[][],
  layout: CanvasLayout,
  revealMode: 'char' | 'line',
  charsToReveal?: number,
  linesToReveal?: number,
): VisualLine[] {
  const lines: VisualLine[] = [];

  if (revealMode === 'line' && linesToReveal !== undefined) {
    const limit = Math.min(tokens.length, linesToReveal + 1);
    for (let i = 0; i < limit; i++) {
      lines.push(...wrapTokensToVisualLines(ctx, tokens[i], layout.maxLineWidth, i));
    }
    return lines;
  }

  if (charsToReveal === undefined) return lines;

  let sourceChars = 0;
  for (let sourceLine = 0; sourceLine < tokens.length; sourceLine++) {
    const lineLen = tokens[sourceLine].reduce((sum, token) => sum + token.content.length, 0);
    const lineStart = sourceChars;
    const lineEnd = sourceChars + lineLen;
    const visualLines = wrapTokensToVisualLines(ctx, tokens[sourceLine], layout.maxLineWidth, sourceLine);

    if (charsToReveal >= lineEnd) {
      lines.push(...visualLines);
    } else if (charsToReveal > lineStart) {
      const charsOnLine = charsToReveal - lineStart;
      let consumed = 0;

      for (const visualLine of visualLines) {
        const lineChars = visualLine.tokens.reduce((sum, part) => sum + part.text.length, 0);
        if (consumed + lineChars <= charsOnLine) {
          lines.push(visualLine);
          consumed += lineChars;
        } else {
          lines.push(sliceVisualLineByChars(visualLine, charsOnLine - consumed));
          break;
        }
      }
      break;
    } else {
      break;
    }

    sourceChars = lineEnd + 1;
  }

  return lines;
}

export function drawVisualLines(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  visualLines: VisualLine[],
  layout: CanvasLayout,
  scrollOffsetY: number,
  showLineNumbers: boolean,
  lineNumberForSourceLine: (sourceLineIndex: number) => number,
) {
  const { padding, lineHeight, codeStartX } = layout;

  let lastSourceLine = -1;
  visualLines.forEach((visualLine, index) => {
    const y = padding + index * lineHeight - scrollOffsetY;

    if (showLineNumbers && visualLine.sourceLineIndex !== lastSourceLine) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillText(
        String(lineNumberForSourceLine(visualLine.sourceLineIndex)),
        padding,
        y,
      );
      lastSourceLine = visualLine.sourceLineIndex;
    }

    let x = codeStartX;
    for (const part of visualLine.tokens) {
      ctx.fillStyle = part.color || '#fff';
      ctx.fillText(part.text, x, y);
      x += ctx.measureText(part.text).width;
    }
  });

  return visualLines.length > 0
    ? padding + (visualLines.length - 1) * lineHeight
    : padding;
}
