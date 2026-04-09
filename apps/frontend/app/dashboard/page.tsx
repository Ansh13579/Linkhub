'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function useApi<T>(endpoint: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('lh_token');
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => { fetchData(); }, [fetchData]);
  return { data, loading, refetch: fetchData };
}

interface Summary {
  total_clicks: number;
  today_clicks: number;
  top_link: { title: string; clicks: number } | null;
  week_trend: { date: string; clicks: number }[];
}

export default function DashboardPage() {
  const tenant = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('lh_tenant') || '{}')
    : {};

  const { data: summary, loading: summaryLoading } = useApi<Summary>('/api/analytics/summary');
  const { data: links, loading: linksLoading } = useApi<any[]>('/api/links');

  const totalLinks = links?.length ?? 0;
  const activeLinks = links?.filter((l: any) => l.is_active).length ?? 0;

  const STATS = [
    { label: 'Total Clicks', value: summary?.total_clicks?.toLocaleString() ?? '—', icon: '👆', sub: 'All time', color: '#7c3aed' },
    { label: "Today's Clicks", value: summary?.today_clicks?.toLocaleString() ?? '—', icon: '📅', sub: 'Last 24h', color: '#06b6d4' },
    { label: 'Active Links', value: `${activeLinks} / ${totalLinks}`, icon: '🔗', sub: 'Published', color: '#22c55e' },
    { label: 'Top Link', value: summary?.top_link?.title ?? '—', icon: '🏆', sub: summary?.top_link ? `${summary.top_link.clicks} clicks` : 'No data yet', color: '#f59e0b', truncate: true },
  ];

  return (
    <div className={styles.page}>
      {/* Welcome header */}
      <div className={styles.welcome}>
        <div>
          <h1 className={styles.welcomeTitle}>
            Welcome back{tenant?.name ? `, ${tenant.name.split(' ')[0]}` : ''} 👋
          </h1>
          <p className={styles.welcomeSlug}>
            Your page: <a href={`/t/${tenant?.slug}`} target="_blank" className={styles.slugLink}>/t/{tenant?.slug}</a>
          </p>
        </div>
        <Link href="/dashboard/links" className="btn btn-primary">
          + Add Link
        </Link>
      </div>

      {/* Stats grid */}
      <div className={styles.statsGrid}>
        {STATS.map((s, i) => (
          <div
            key={s.label}
            className="stat-card"
            style={{ animationDelay: `${i * 0.08}s` }}
          >
            <div className={styles.statGlow} style={{ background: `radial-gradient(circle at top right, ${s.color}15, transparent 70%)` }} />
            <div className={styles.statHeader}>
              <span className={styles.statIcon}>{s.icon}</span>
              <span className={styles.statLabel}>{s.label}</span>
            </div>
            {summaryLoading || linksLoading ? (
              <div className="skeleton" style={{ width: '60%', height: 32, marginTop: 8 }} />
            ) : (
              <div className={styles.statValue} style={{ color: s.color, fontSize: s.truncate ? '1.1rem' : undefined }}>
                {s.value}
              </div>
            )}
            <div className={styles.statSub}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Quick actions + Week trend */}
      <div className={styles.grid2}>
        {/* Quick actions */}
        <div className="card">
          <h2 className={styles.cardTitle}>Quick Actions</h2>
          <div className={styles.quickActions}>
            {[
              { label: 'Manage Links', icon: '🔗', href: '/dashboard/links', desc: 'Add, edit, and reorder your links' },
              { label: 'View Analytics', icon: '📊', href: '/dashboard/analytics', desc: 'Clicks, heatmaps, and sources' },
              { label: 'Customize Theme', icon: '🎨', href: '/dashboard/settings', desc: 'Colors, fonts, and button styles' },
              { label: 'View My Page', icon: '↗', href: `/t/${tenant?.slug}`, desc: 'See your public profile', external: true },
            ].map(action => (
              <Link
                key={action.label}
                href={action.href}
                target={action.external ? '_blank' : undefined}
                className={styles.quickAction}
              >
                <span className={styles.qaIcon}>{action.icon}</span>
                <div>
                  <div className={styles.qaLabel}>{action.label}</div>
                  <div className={styles.qaDesc}>{action.desc}</div>
                </div>
                <span className={styles.qaArrow}>→</span>
              </Link>
            ))}
          </div>
        </div>

        {/* 7-day trend (simple bar visualization) */}
        <div className="card">
          <h2 className={styles.cardTitle}>7-Day Click Trend</h2>
          {summaryLoading ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 120, marginTop: 16 }}>
              {[1,2,3,4,5,6,7].map(i => (
                <div key={i} className="skeleton" style={{ flex: 1, height: `${Math.random() * 80 + 20}%`, borderRadius: 6 }} />
              ))}
            </div>
          ) : (
            <WeekTrend trend={summary?.week_trend ?? []} />
          )}
        </div>
      </div>

      {/* Recent links preview */}
      <div className="card" style={{ marginTop: 24 }}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Your Links</h2>
          <Link href="/dashboard/links" className="btn btn-ghost" style={{ fontSize: '0.8125rem' }}>
            Manage all →
          </Link>
        </div>
        {linksLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 52, borderRadius: 10 }} />)}
          </div>
        ) : links && links.length > 0 ? (
          <div className={styles.linksList}>
            {links.slice(0, 5).map((link: any) => (
              <div key={link.id} className={styles.linkItem}>
                <span className={styles.linkIcon}>{link.icon || '🔗'}</span>
                <div className={styles.linkInfo}>
                  <div className={styles.linkTitle}>{link.title}</div>
                  <div className={styles.linkUrl}>{link.url}</div>
                </div>
                <div className={styles.linkClicks}>{link.click_count?.toLocaleString() ?? 0} clicks</div>
                <div className={`badge ${link.is_active ? 'badge-green' : 'badge-red'}`}>
                  {link.is_active ? 'Active' : 'Hidden'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyLinks />
        )}
      </div>
    </div>
  );
}

function WeekTrend({ trend }: { trend: { date: string; clicks: number }[] }) {
  const max = Math.max(...trend.map(t => t.clicks), 1);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (trend.length === 0) {
    return (
      <div className={styles.trendEmpty}>
        No click data yet. Share your page to start tracking!
      </div>
    );
  }

  return (
    <div className={styles.trendWrap}>
      {trend.map(item => {
        const bar = Math.round((item.clicks / max) * 100);
        const d = new Date(item.date);
        return (
          <div key={item.date} className={styles.trendBar}>
            <div className={styles.trendBarFill} style={{ height: `${Math.max(bar, 4)}%` }}>
              <div className={styles.trendTooltip}>{item.clicks}</div>
            </div>
            <div className={styles.trendLabel}>{days[d.getDay()]}</div>
          </div>
        );
      })}
    </div>
  );
}

function EmptyLinks() {
  return (
    <div className={styles.emptyLinks}>
      <div style={{ fontSize: '2.5rem' }}>🔗</div>
      <h3>No links yet</h3>
      <p>Add your first link and share it with the world!</p>
      <Link href="/dashboard/links" className="btn btn-primary">
        + Add Your First Link
      </Link>
    </div>
  );
}
