import type { CSSProperties } from 'react';

/**
 * Exposes the title's longest word length as `--title-longest-word` so CSS can cap the display size and a
 * single long word (e.g. "Mulabonding") never has to break mid-word, and the length of the longer line of its
 * most even two-line split as `--title-two-lines` (16 for "Ambient Communal / Intelligence"), for layouts that
 * keep titles to two lines.
 */
export function titleFitStyle(title: string): CSSProperties {
  const words = title.split(/\s+/);
  const longestWord = Math.max(...words.map((word) => word.length));
  let twoLines = title.length;
  for (let split = 1; split < words.length; split += 1) {
    const first = words.slice(0, split).join(' ');
    const second = words.slice(split).join(' ');
    twoLines = Math.min(twoLines, Math.max(first.length, second.length));
  }
  return { '--title-longest-word': longestWord, '--title-two-lines': twoLines } as CSSProperties;
}
