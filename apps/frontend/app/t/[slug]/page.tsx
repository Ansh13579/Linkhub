'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import styles from './page.module.css';

interface Theme {
  primary_color: string;
  secondary_color: string;
  background_color: string;
  text_color: string;
  card_color: string;
  font_family: string;
  button_style: string;
  button_radius: string;
  background_type: string;
  background_value: string;
}

interface Tenant {
  id: string;
  slug: string;
  name: string;
  bio: string;
  avatar_url: string;
}

interface Link {
  id: string;
  title: string;
  url: string;
  icon: string;
  description: string;
  click_count: number;
}

interface ProfileData {
  tenant: Tenant & Theme;
  links: Link[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function TenantProfilePage() {
  const params = useParams<{ slug: string }>();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [clickedLink, setClickedLink] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(`${API_URL}/api/tenants/public/${params.slug}`);
        if (res.status === 404) { setNotFound(true); return; }
        if (!res.ok) throw new Error('Failed to load');
        const json = await res.json();
        setData(json);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [params.slug]);

  // Inject CSS variables for tenant theme
  useEffect(() => {
    if (!data?.tenant) return;
    const t = data.tenant;
    const root = document.documentElement;
    root.style.setProperty('--primary', t.primary_color);
    root.style.setProperty('--secondary', t.secondary_color);
    root.style.setProperty('--bg', t.background_color);
    root.style.setProperty('--text', t.text_color);
    root.style.setProperty('--card', t.card_color);
    root.style.setProperty('--font', `'${t.font_family}', sans-serif`);
    root.style.setProperty('--btn-radius', t.button_radius);
    document.body.style.background =
      t.background_type === 'gradient' ? t.background_value : t.background_color;
    document.body.style.fontFamily = `'${t.font_family}', sans-serif`;
    document.body.style.color = t.text_color;

    // Load Google Font dynamically
    const fontMap: Record<string, string> = {
      'Inter': 'Inter:wght@400;500;600;700;800',
      'Space Grotesk': 'Space+Grotesk:wght@400;500;600;700',
      'DM Sans': 'DM+Sans:wght@400;500;600;700',
      'Outfit': 'Outfit:wght@400;500;600;700;800',
    };
    const fontKey = fontMap[t.font_family] || 'Inter:wght@400;600;700';
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${fontKey}&display=swap`;
    document.head.appendChild(link);

    return () => {
      root.removeAttribute('style');
      document.body.removeAttribute('style');
    };
  }, [data]);

  async function handleLinkClick(link: Link) {
    setClickedLink(link.id);
    // Record click event (fire and forget)
    if (data?.tenant) {
      fetch(`${API_URL}/api/analytics/click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          link_id: link.id,
          tenant_id: data.tenant.id,
          traffic_source: document.referrer ? 'referral' : 'direct',
          device: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
        }),
      }).catch(() => {});
    }
    // Small visual delay then navigate
    setTimeout(() => {
      window.open(link.url, '_blank', 'noopener,noreferrer');
      setClickedLink(null);
    }, 150);
  }

  if (loading) return <LoadingSkeleton />;
  if (notFound || !data) return <NotFound slug={params.slug} />;

  const { tenant, links } = data;
  const btnClass = `link-btn style-${tenant.button_style}`;

  return (
    <div className={styles.page} style={{ fontFamily: `'${tenant.font_family}', sans-serif` }}>
      {/* Ambient background glow */}
      <div
        className={styles.ambientGlow}
        style={{
          background: `radial-gradient(ellipse 70% 40% at 50% 0%, ${tenant.primary_color}25, transparent)`,
        }}
      />

      <main className={styles.container}>
        {/* Avatar + Header */}
        <header className={styles.header}>
          <div className={styles.avatarWrap}>
            <img
              src={tenant.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${tenant.slug}`}
              alt={tenant.name}
              className={styles.avatar}
            />
            <div
              className={styles.avatarRing}
              style={{ borderColor: `${tenant.primary_color}60` }}
            />
          </div>
          <h1 className={styles.name}>{tenant.name}</h1>
          {tenant.bio && <p className={styles.bio}>{tenant.bio}</p>}

          {/* Powered by badge */}
          <div className={styles.poweredBy}>
            <a href="/" className={styles.poweredByLink}>
              🔗 LinkHub
            </a>
          </div>
        </header>

        {/* Links */}
        <div className={styles.links}>
          {links.length === 0 ? (
            <div className={styles.emptyState}>
              <span>🔗</span>
              <p>No links added yet</p>
            </div>
          ) : (
            links.map((link, idx) => (
              <button
                key={link.id}
                className={btnClass}
                onClick={() => handleLinkClick(link)}
                aria-label={`Visit ${link.title}`}
                style={{
                  animationDelay: `${idx * 0.07}s`,
                  opacity: clickedLink === link.id ? 0.7 : 1,
                  transform: clickedLink === link.id ? 'scale(0.98)' : undefined,
                }}
              >
                {link.icon && <span className={styles.linkIcon}>{link.icon}</span>}
                <span className={styles.linkText}>{link.title}</span>
                {clickedLink === link.id ? (
                  <span className={styles.linkLoading}>⏳</span>
                ) : (
                  <span className={styles.linkArrow}>↗</span>
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <footer className={styles.footer}>
          <a href="/" className={styles.footerLink}>
            Create your own LinkHub →
          </a>
        </footer>
      </main>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20 }}>
      <div className="skeleton" style={{ width: 80, height: 80, borderRadius: '50%' }} />
      <div className="skeleton" style={{ width: 160, height: 20 }} />
      <div className="skeleton" style={{ width: 240, height: 12 }} />
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="skeleton" style={{ width: '100%', maxWidth: 480, height: 56, animationDelay: `${i * 0.1}s` }} />
      ))}
    </div>
  );
}

function NotFound({ slug }: { slug: string }) {
  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 24, color: '#e8e8f0', fontFamily: 'Inter' }}>
      <div style={{ fontSize: '4rem' }}>🔍</div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Profile not found</h1>
      <p style={{ color: 'rgba(232,232,240,0.5)', textAlign: 'center' }}>
        <strong style={{ color: '#a78bfa' }}>@{slug}</strong> hasn't claimed their LinkHub yet.
      </p>
      <a href="/register" style={{ padding: '12px 24px', background: '#7c3aed', color: '#fff', borderRadius: 12, fontWeight: 600, marginTop: 8 }}>
        Claim this username →
      </a>
    </div>
  );
}
