import type { CSSProperties, Ref } from 'react';

export type Ambience = readonly [string, string, string];

export const DEFAULT_AMBIENCE: Ambience = ['#319a83', '#703f4c', '#956e66'];

type AmbientStyle = CSSProperties & {
  '--ambient-a': string;
  '--ambient-b': string;
  '--ambient-c': string;
};

export function ambienceStyle(ambience: Ambience): AmbientStyle {
  return {
    '--ambient-a': ambience[0],
    '--ambient-b': ambience[1],
    '--ambient-c': ambience[2],
  };
}

/** Fixed, slowly drifting colour field driven by the `--ambient-*` custom properties. */
export default function AmbientField({ ambience, fieldRef }: { ambience: Ambience; fieldRef?: Ref<HTMLDivElement> }) {
  return (
    <div className="ambient-field" ref={fieldRef} style={ambienceStyle(ambience)} aria-hidden="true">
      <span className="ambient-blob ambient-blob-a" />
      <span className="ambient-blob ambient-blob-b" />
      <span className="ambient-blob ambient-blob-c" />
      <span className="ambient-grain" />
    </div>
  );
}
