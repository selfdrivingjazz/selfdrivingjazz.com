import type { CSSProperties } from 'react';
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

interface CrateBackdropProps {
  ambience: Ambience;
  activeIndex: number;
  activeSide: CoverSide;
}

/**
 * The crate's room: a softly lit wall, an overhead key light drifting very slowly and a pool of light on the
 * floor, coloured from the active sleeve's precomputed palette. Changing records fades the colours across.
 */
export default function CrateBackdrop({ ambience, activeIndex, activeSide }: CrateBackdropProps) {
  return (
    <div
      className="crate-backdrop"
      style={lighting(ambience)}
      data-active-index={activeIndex}
      data-active-side={activeSide}
      aria-hidden="true"
    >
      <div className="cb-wall" />
      <div className="cb-rig">
        <div className="cb-beam" />
        <div className="cb-pool" />
      </div>
      <div className="cb-grain" />
    </div>
  );
}
