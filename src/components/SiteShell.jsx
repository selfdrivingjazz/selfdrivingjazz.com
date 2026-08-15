import Header from './Header.jsx';

export default function SiteShell({ children, className = '' }) {
  return (
    <div className={`page site-shell ${className}`.trim()}>
      <Header />
      {children}
    </div>
  );
}
