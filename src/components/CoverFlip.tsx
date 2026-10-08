'use client';

import Image from 'next/image';
import { useState } from 'react';

interface CoverFlipProps {
  front: { src: string; alt: string };
  /** Real back-cover art; when absent a typeset sleeve back is shown instead. */
  back?: { src: string; alt: string };
  title: string;
  label: string;
  year: string;
  collaborators: string;
  summary: string;
  /** CSS background shown until the cover image loads. */
  placeholder: string;
}

/** Record sleeve that turns over to its back cover when clicked. */
export default function CoverFlip({ front, back, title, label, year, collaborators, summary, placeholder }: CoverFlipProps) {
  const [flipped, setFlipped] = useState(false);

  return (
    <button
      type="button"
      className={`cover-flip${flipped ? ' is-flipped' : ''}`}
      aria-pressed={flipped}
      aria-label={flipped ? `Show ${title} front cover` : `Turn ${title} over to the back cover`}
      onClick={() => setFlipped((value) => !value)}
    >
      <span className="cover-flip-inner">
        <span className="cover-face cover-front" style={{ background: placeholder }}>
          <Image src={front.src} width={1600} height={1600} sizes="(min-width: 900px) 600px, 100vw" alt={front.alt} priority />
        </span>
        <span className="cover-face cover-back" aria-hidden={!flipped}>
          {back ? (
            <Image src={back.src} width={1600} height={1600} sizes="(min-width: 900px) 600px, 100vw" alt={back.alt} />
          ) : (
            <span className="sleeve-back">
              <span className="sleeve-back-head">
                <span>self-driving jazz</span>
                <span>{label}</span>
              </span>
              <span className="sleeve-back-title">{title}</span>
              <span className="sleeve-back-summary">{summary}</span>
              <span className="sleeve-back-foot">
                <span>{year}</span>
                <span>with {collaborators}</span>
              </span>
            </span>
          )}
        </span>
      </span>
      <span className="cover-flip-hint" aria-hidden="true">{flipped ? 'front' : 'flip'} ↻</span>
    </button>
  );
}
