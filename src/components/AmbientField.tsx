'use client';

import { useState } from 'react';
import type { CoverSide } from '../RecordCrate';
import { optimizedImageUrl } from '../lib/imageUrl';

interface Cover {
  url: string;
  placeholder: string;
}

/** Two persistent layers: the active one shows the current cover, the other is hidden or fading out. */
interface Backdrop {
  layers: readonly [Cover | null, Cover | null];
  active: 0 | 1;
}

function showCover({ layers, active }: Backdrop, cover: Cover): Backdrop {
  // Same art (e.g. a sleeve without a back): refresh in place, no cross-fade.
  const target = layers[active]?.url === cover.url ? active : active === 0 ? 1 : 0;
  // Otherwise the incoming art takes the layer that is hidden or fading out, so a quick change reverses that fade.
  return { layers: target === 0 ? [cover, layers[1]] : [layers[0], cover], active: target };
}

interface AmbientFieldProps {
  /** Raw URL of the artwork shown now; the backdrop loads its 384px optimised rendition. */
  coverUrl: string;
  /** Precomputed CSS gradient of that artwork, painted under it so the colours are right before it loads. */
  placeholder: string;
  /** Index of the item the cover belongs to, exposed as `data-active-index` for diagnostics. */
  activeIndex?: number;
  /** Which face of that item's sleeve is shown, exposed as `data-active-side`. */
  activeSide?: CoverSide;
}

/** Fixed, drifting, blurred and darkened rendition of the active cover art under a scrim; cross-fades when the cover changes. */
export default function AmbientField({ coverUrl, placeholder, activeIndex, activeSide }: AmbientFieldProps) {
  const [backdrop, setBackdrop] = useState<Backdrop>(() => ({ layers: [{ url: coverUrl, placeholder }, null], active: 0 }));
  const shown = backdrop.layers[backdrop.active];
  // Follow the selection in the same render it changes in; the art loads behind its placeholder.
  if (shown?.url !== coverUrl || shown.placeholder !== placeholder) {
    setBackdrop(showCover(backdrop, { url: coverUrl, placeholder }));
  }

  return (
    <div
      className="ambient-field"
      data-active-index={activeIndex}
      data-active-side={activeSide}
      data-cover-url={coverUrl}
      data-active-layer={backdrop.active}
      aria-hidden="true"
    >
      {backdrop.layers.map((cover, index) => (
        <div key={index} className={`ambient-layer${index === backdrop.active ? ' is-active' : ''}`}>
          <span
            className="ambient-art"
            style={cover ? { background: `url("${optimizedImageUrl(cover.url, 384)}") center / cover no-repeat, ${cover.placeholder}` } : undefined}
          />
        </div>
      ))}
    </div>
  );
}
