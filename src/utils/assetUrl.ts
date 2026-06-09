/** Resolve a public-folder path for the current Vite base (e.g. /NeonSnip/). */
export function assetUrl(path: string): string {
  const normalized = path.startsWith('/') ? path.slice(1) : path;
  return `${import.meta.env.BASE_URL}${normalized}`;
}
