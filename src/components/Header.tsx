'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export function Logo({ large = false }: { large?: boolean }) {
  const size = large ? 120 : 24;
  return (
    <Image
      className={large ? 'logo logo-large' : 'logo'}
      src="/sdj-logo.png"
      width={size}
      height={size}
      sizes={`${size}px`}
      alt="Self-Driving Jazz shrimp playing saxophone"
      priority
    />
  );
}

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    function handlePointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !headerRef.current?.contains(event.target)) setMenuOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      setMenuOpen(false);
      buttonRef.current?.focus();
    }
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  const activePage = pathname === '/'
    ? 'home'
    : pathname.startsWith('/projects')
      ? 'projects'
      : pathname.startsWith('/method')
        ? 'method'
        : pathname === '/about'
          ? 'about'
          : undefined;

  return (
    <header className="header" ref={headerRef}>
      <Link href="/" aria-label="Self-Driving Jazz home"><Logo /></Link>
      <button
        ref={buttonRef}
        className="menu-link"
        type="button"
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-controls="site-menu"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span />
        <span />
      </button>
      <nav id="site-menu" className={`site-menu${menuOpen ? ' is-open' : ''}`} aria-label="Site">
        <Link href="/" aria-current={activePage === 'home' ? 'page' : undefined}>home</Link>
        <Link href="/projects" aria-current={activePage === 'projects' ? 'page' : undefined}>projects</Link>
        <Link href="/method" aria-current={activePage === 'method' ? 'page' : undefined}>method</Link>
        <Link href="/about" aria-current={activePage === 'about' ? 'page' : undefined}>about</Link>
      </nav>
    </header>
  );
}
