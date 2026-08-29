import type { ReactNode } from 'react';

import Header from './Header';

export default function SiteShell({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`page site-shell ${className}`.trim()}>
      <Header />
      {children}
    </div>
  );
}
