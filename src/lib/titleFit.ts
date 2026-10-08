import type { CSSProperties } from 'react';

/**
 * Exposes the title's longest word length as `--title-longest-word` so CSS can cap the
 * display size and a single long word (e.g. "Mulabonding") never has to break mid-word.
 */
export function titleFitStyle(title: string): CSSProperties {
  const longestWord = Math.max(...title.split(/\s+/).map((word) => word.length));
  return { '--title-longest-word': longestWord } as CSSProperties;
}
