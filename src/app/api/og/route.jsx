import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ImageResponse } from 'next/og';
import { getProject } from '../../../data/projects.js';
import { DEFAULT_DESCRIPTION, SITE_NAME } from '../../../lib/metadata.js';

export const runtime = 'nodejs';

export async function GET(request) {
  const url = new URL(request.url);
  const project = getProject(url.searchParams.get('project'));
  const artworkPath = project?.ogCover ?? '/sdj-logo.jpg';
  const artwork = await readFile(path.join(process.cwd(), 'public', artworkPath.slice(1)));
  const artworkType = artworkPath.endsWith('.png') ? 'image/png' : 'image/jpeg';
  const artworkUrl = `data:${artworkType};base64,${artwork.toString('base64')}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'stretch',
          justifyContent: 'space-between',
          padding: '64px',
          background: '#080808',
          color: '#f0f0ed',
          fontFamily: 'Arial, Helvetica, sans-serif',
        }}
      >
        <div
          style={{
            width: '540px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '58px', letterSpacing: '-3px' }}>{SITE_NAME}</div>
            <div style={{ marginTop: '18px', color: '#8d8d89', fontSize: '24px' }}>
              {project?.summary ?? DEFAULT_DESCRIPTION}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {project && (
              <div style={{ color: '#8d8d89', fontSize: '18px', letterSpacing: '2px' }}>
                {project.label}
              </div>
            )}
            {project && (
              <div style={{ marginTop: '8px', fontSize: '34px' }}>{project.title}</div>
            )}
          </div>
        </div>
        <div
          style={{
            width: '502px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #2d2d2b',
            background: '#050505',
          }}
        >
          <img
            src={artworkUrl}
            width={500}
            height={500}
            alt=""
            style={{ objectFit: 'cover' }}
          />
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    },
  );
}
