import { createHighlighter } from 'shiki';
import type { Highlighter, ThemedToken } from 'shiki';

let highlighterInstance: Highlighter | null = null;
let isInitializing = false;

// We will use standard Shiki bundle which is large but fine for this project
export const initializeHighlighter = async () => {
  if (highlighterInstance) return highlighterInstance;
  if (isInitializing) {
    // Wait until initialized if it's already in progress
    return new Promise<Highlighter>((resolve) => {
      const interval = setInterval(() => {
        if (highlighterInstance) {
          clearInterval(interval);
          resolve(highlighterInstance);
        }
      }, 50);
    });
  }

  isInitializing = true;
  highlighterInstance = await createHighlighter({
    themes: ['dracula', 'synthwave-84', 'monokai', 'nord'],
    langs: ['javascript', 'typescript', 'python', 'java', 'html', 'css', 'json', 'markdown', 'rust', 'go'],
  });
  isInitializing = false;
  return highlighterInstance;
};

export const tokenize = async (code: string, language: string, theme: string): Promise<ThemedToken[][]> => {
  const hl = await initializeHighlighter();
  
  // fallback if language is not loaded
  const langToUse = hl.getLoadedLanguages().includes(language as any) ? language : 'javascript';
  const themeToUse = hl.getLoadedThemes().includes(theme) ? theme : 'dracula';

  return hl.codeToTokensBase(code, {
    lang: langToUse as any,
    theme: themeToUse as any,
  });
};
