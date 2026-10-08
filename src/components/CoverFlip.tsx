'use client';

import Image from 'next/image';
import { useState } from 'react';

interface CoverFlipProps {
  front: { src: string; alt: string };
  /** Back-cover art; when absent the front cover is shown on the back too. */
  back?: { src: string; alt: string };
  title: string;
  /** CSS background shown until the cover image loads. */
  placeholder: string;
}

/** Record sleeve that turns over to its back cover when clicked. */
export default function CoverFlip({ front, back = front, title, placeholder }: CoverFlipProps) {
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
        <span className="cover-face cover-back" style={{ background: placeholder }} aria-hidden={!flipped}>
          <Image src={back.src} width={1600} height={1600} sizes="(min-width: 900px) 600px, 100vw" alt={back.alt} />
        </span>
      </span>
      <span className="cover-flip-hint" aria-hidden="true">{flipped ? 'front' : 'flip'} ↻</span>
    </button>
  );
}
