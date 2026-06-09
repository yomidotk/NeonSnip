import type { ThemedToken } from 'shiki';
import type { RevealMode } from '../store/useStore';

export interface TypewriterState {
  elapsedMs: number;
  wpm: number;
  revealMode: RevealMode;
  totalCharsInCode: number;
  totalLinesInCode: number;
}

export const getCharsPerSecond = (wpm: number) => {
  // Assume average word is 5 chars + 1 space = 6 chars
  return (wpm * 5) / 60; 
};

export const calculateVisibleContent = (
  state: TypewriterState,
  lines: ThemedToken[][]
) => {
  const { elapsedMs, wpm, revealMode, totalCharsInCode } = state;
  
  if (revealMode === 'char') {
    const cps = getCharsPerSecond(wpm);
    const charsToReveal = Math.floor(cps * (elapsedMs / 1000));
    return {
      charsToReveal: Math.min(charsToReveal, totalCharsInCode),
      isFinished: charsToReveal >= totalCharsInCode
    };
  } else {
    // Line mode: assume each line takes some time proportional to its length or just fixed time per line
    // To keep it proportional, we can just use the character count but reveal the whole line at once
    // when charsToReveal passes the end of the line.
    const cps = getCharsPerSecond(wpm);
    const charsToReveal = Math.floor(cps * (elapsedMs / 1000));
    
    let currentLine = 0;
    let charsCounted = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const lineLen = lines[i].reduce((sum, token) => sum + token.content.length, 0);
      charsCounted += lineLen + 1; // +1 for newline
      if (charsToReveal < charsCounted) {
        currentLine = i;
        break;
      }
      if (i === lines.length - 1) {
        currentLine = lines.length; // Finished
      }
    }
    
    return {
      linesToReveal: currentLine,
      charsToReveal, // used for keeping track of time
      isFinished: currentLine >= lines.length
    };
  }
};

export const getTotalDurationMs = (totalChars: number, wpm: number) => {
  const cps = getCharsPerSecond(wpm);
  return (totalChars / cps) * 1000;
};
