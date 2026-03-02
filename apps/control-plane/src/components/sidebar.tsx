'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: 'System Health', icon: '◉' },
  { href: '/capital', label: 'Capital Flow', icon: '⟡' },
  { href: '/keys', label: 'Key Authority', icon: '⚷' },
  { href: '/compliance', label: 'Compliance', icon: '⛊' },
  { href: '/chains', label: 'Chain Monitor', icon: '⟠' },
  { href: '/namespaces', label: 'Namespaces', icon: '⌘' },
  { href: '/agents', label: 'Agent Governance', icon: '⚙' },
  { href: '/audit', label: 'Audit Trail', icon: '⧫' },
  { href: '/settlement', label: 'Settlement', icon: '⇌' },
  { href: '/risk', label: 'Risk Exposure', icon: '△' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 flex-col border-r border-sovereign-700/50 bg-sovereign-950">
      {/* Brand */}
      <div className="border-b border-sovereign-700/50 px-6 py-5">
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-gold-400">
          Sovereign
        </div>
        <div className="mt-1 text-lg font-semibold text-sovereign-100">
          Control Plane
        </div>
        <div className="mt-1 text-xs text-sovereign-500">
          Men of God Dev & Investments
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={isActive ? 'nav-link-active' : 'nav-link'}
            >
              <span className="w-5 text-center text-base">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* System Status Footer */}
      <div className="border-t border-sovereign-700/50 px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="status-dot-healthy" />
          <span className="text-xs text-sovereign-400">System Nominal</span>
        </div>
        <div className="mt-2 font-mono text-xs text-sovereign-600">
          v0.1.0 · sovereign-spine
        </div>
      </div>
    </aside>
  );
}
