'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from './layout.module.css';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview', icon: '⊞' },
  { href: '/dashboard/links', label: 'Links', icon: '🔗' },
  { href: '/dashboard/analytics', label: 'Analytics', icon: '📊' },
  { href: '/dashboard/settings', label: 'Appearance', icon: '🎨' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [tenant, setTenant] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('lh_token');
    if (!token) { router.replace('/login'); return; }
    const t = localStorage.getItem('lh_tenant');
    if (t) setTenant(JSON.parse(t));
  }, [router]);

  function handleLogout() {
    localStorage.removeItem('lh_token');
    localStorage.removeItem('lh_user');
    localStorage.removeItem('lh_tenant');
    router.replace('/login');
  }

  return (
    <div className="dash-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`dash-sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className={styles.sidebarLogo}>
          <Link href="/" className={styles.logoLink}>
            <span className={styles.logoIcon}>🔗</span>
            <span className={styles.logoText}>LinkHub</span>
          </Link>
        </div>

        {/* Tenant info */}
        {tenant && (
          <div className={styles.tenantCard}>
            <img
              src={tenant.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${tenant.slug}`}
              alt={tenant.name}
              className={styles.tenantAvatar}
            />
            <div className={styles.tenantInfo}>
              <div className={styles.tenantName}>{tenant.name}</div>
              <div className={styles.tenantSlug}>@{tenant.slug}</div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className={styles.nav}>
          {NAV_ITEMS.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${pathname === item.href ? styles.navItemActive : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className={styles.sidebarBottom}>
          {tenant && (
            <Link
              href={`/t/${tenant.slug}`}
              target="_blank"
              className={styles.viewProfile}
            >
              <span>↗</span> View My Page
            </Link>
          )}
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <span>⎋</span> Sign Out
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="dash-main">
        {/* Top header */}
        <div className="dash-header">
          <button
            className={styles.menuButton}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle menu"
          >
            ☰
          </button>
          <div style={{ flex: 1 }} />
          {tenant && (
            <span className={styles.headerSlug}>
              linkhub.io/t/<strong>{tenant.slug}</strong>
            </span>
          )}
        </div>

        <div className="dash-content animate-fade-in">
          {children}
        </div>
      </div>
    </div>
  );
}
