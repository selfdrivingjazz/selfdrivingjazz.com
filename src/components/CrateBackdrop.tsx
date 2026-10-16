'use client';

import type { CSSProperties } from 'react';
import { useEffect, useRef } from 'react';
import type { CoverSide } from '../RecordCrate';
import type { Ambience } from './AmbientField';

type BackdropStyle = CSSProperties & {
  '--cb-key': string;
  '--cb-fill': string;
  '--cb-ink': string;
};

/** Relative colourfulness of a `#rrggbb` colour (HSV chroma), used to pick the stage light. */
function chroma(hex: string): number {
  const value = Number.parseInt(hex.slice(1), 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return Math.max(red, green, blue) - Math.min(red, green, blue);
}

/**
 * Stage lighting from the sleeve's generated palette `[dominant, accent, accent]`: the most colourful accent is
 * the key light, the other accent fills, and the dominant colour tints the room.
 */
function lighting([dominant, first, second]: Ambience): BackdropStyle {
  const [key, fill] = chroma(second) > chroma(first) ? [second, first] : [first, second];
  return { '--cb-key': key, '--cb-fill': fill, '--cb-ink': dominant };
}

const SWEEP_MS = 900;

interface CrateBackdropProps {
  ambience: Ambience;
  activeIndex: number;
  activeSide: CoverSide;
  recordCount: number;
}

/**
 * The crate's room: a lit wall, a slowly spinning vinyl sheen behind the crate, a swaying key light and a floor
 * pool, all coloured from the active sleeve's precomputed palette. Changing records or turning the crate round
 * sweeps a band of the new light across the room in the direction of travel.
 */
export default function CrateBackdrop({ ambience, activeIndex, activeSide, recordCount }: CrateBackdropProps) {
  const sweepRef = useRef<HTMLDivElement | null>(null);
  const rigRef = useRef<HTMLDivElement | null>(null);
  const previousRef = useRef({ index: activeIndex, side: activeSide });
  const animationsRef = useRef<Animation[]>([]);

  useEffect(() => {
    const previous = previousRef.current;
    previousRef.current = { index: activeIndex, side: activeSide };
    if (previous.index === activeIndex && previous.side === activeSide) return;
    const sweep = sweepRef.current;
    const rig = rigRef.current;
    if (!sweep || !rig || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let from: string;
    let to: string;
    if (previous.index !== activeIndex) {
      // Wrapping from the last record to the first still reads as moving forward.
      const forward = (activeIndex - previous.index + recordCount) % recordCount <= recordCount / 2;
      sweep.dataset.axis = 'vertical';
      [from, to] = forward ? ['50% 100%', '50% 0%'] : ['50% 0%', '50% 100%'];
    } else {
      sweep.dataset.axis = 'horizontal';
      [from, to] = activeSide === 'back' ? ['100% 50%', '0% 50%'] : ['0% 50%', '100% 50%'];
    }

    for (const animation of animationsRef.current) animation.cancel();
    animationsRef.current = [
      sweep.animate(
        [
          { opacity: 0, backgroundPosition: from },
          { opacity: 1, offset: 0.25 },
          { opacity: 0, backgroundPosition: to },
        ],
        { duration: SWEEP_MS, easing: 'linear' },
      ),
      rig.animate(
        [{ opacity: 1, transform: 'scale(1.06)' }, { opacity: 0.82, offset: 0.25 }, { opacity: 1, transform: 'scale(1)' }],
        { duration: SWEEP_MS, easing: 'ease-out' },
      ),
    ];
  }, [activeIndex, activeSide, recordCount]);

  useEffect(() => () => {
    for (const animation of animationsRef.current) animation.cancel();
  }, []);

  return (
    <div
      className="crate-backdrop"
      style={lighting(ambience)}
      data-active-index={activeIndex}
      data-active-side={activeSide}
      aria-hidden="true"
    >
      <div className="cb-wall" />
      <div className="cb-record" />
      <div className="cb-rig" ref={rigRef}>
        <div className="cb-beam" />
        <div className="cb-pool" />
      </div>
      <div className="cb-sweep" ref={sweepRef} />
      <div className="cb-grain" />
    </div>
  );
}
