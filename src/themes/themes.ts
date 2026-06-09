export interface ThemeDef {
  id: string;
  name: string;
  shikiTheme: string;
  backgroundColor: string;
  cursorColor: string;
  glowIntensity: number; // css shadow blur
}

export const themes: ThemeDef[] = [
  {
    id: 'neon-tokyo',
    name: 'Neon Tokyo',
    shikiTheme: 'dracula',
    backgroundColor: '#09090b', // zinc-950
    cursorColor: '#f43f5e', // rose-500
    glowIntensity: 15,
  },
  {
    id: 'acid-purple',
    name: 'Acid Purple',
    shikiTheme: 'synthwave-84',
    backgroundColor: '#1e013f', // deep purple
    cursorColor: '#d946ef', // fuchsia-500
    glowIntensity: 25,
  },
  {
    id: 'hacker-green',
    name: 'Hacker Green',
    shikiTheme: 'monokai',
    backgroundColor: '#020617', // slate-950
    cursorColor: '#22c55e', // green-500
    glowIntensity: 20,
  },
  {
    id: 'midnight-blue',
    name: 'Midnight Blue',
    shikiTheme: 'nord',
    backgroundColor: '#0f172a', // slate-900
    cursorColor: '#38bdf8', // sky-400
    glowIntensity: 10,
  }
];

export const getTheme = (id: string): ThemeDef => {
  return themes.find(t => t.id === id) || themes[0];
};
