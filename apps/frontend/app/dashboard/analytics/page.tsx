'use client';

import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import styles from './page.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function authFetch(endpoint: string) {
  const token = localStorage.getItem('lh_token');
  return fetch(`${API_URL}${endpoint}`, { headers: { Authorization: `Bearer ${token}` } });
}

const SOURCE_COLORS = ['#7c3aed', '#06b6d4', '#f59e0b', '#ec4899', '#22c55e', '#f97316', '#a78bfa'];
const SOURCE_LABELS: Record<string, string> = {
  direct: '🔗 Direct',
  instagram: '📸 Instagram',
  twitter: '🐦 Twitter',
  tiktok: '🎵 TikTok',
  google: '🔍 Google',
  facebook: '👥 Facebook',
  referral: '↗ Referral',
};

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<any>(null);
  const [heatmap, setHeatmap] = useState<any[]>([]);
  const [linkStats, setLinkStats] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'heatmap' | 'links' | 'sources'>('heatmap');

  useEffect(() => {
    Promise.all([
      authFetch('/api/analytics/summary').then(r => r.json()),
      authFetch('/api/analytics/heatmap').then(r => r.json()),
      authFetch('/api/analytics/links').then(r => r.json()),
      authFetch('/api/analytics/sources').then(r => r.json()),
      authFetch('/api/analytics/devices').then(r => r.json()),
    ]).then(([s, h, l, src, d]) => {
      setSummary(s);
      setHeatmap(h);
      setLinkStats(l);
      setSources(src);
      setDevices(d);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const maxHeatmapClicks = Math.max(...heatmap.map(h => h.clicks), 1);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Analytics</h1>
          <p className={styles.subtitle}>90 days of click data, visualized</p>
        </div>
      </div>

      {/* Top metrics */}
      <div className={styles.metricsRow}>
        {[
          { label: 'Total Clicks', value: summary?.total_clicks?.toLocaleString() ?? '—', icon: '👆', color: '#7c3aed' },
          { label: "Today's Clicks", value: summary?.today_clicks?.toLocaleString() ?? '—', icon: '📅', color: '#06b6d4' },
          { label: 'Top Link', value: summary?.top_link?.title ?? 'N/A', icon: '🏆', color: '#f59e0b', small: true },
        ].map((m, i) => (
          <div key={m.label} className={`stat-card ${styles.metricCard}`} style={{ animationDelay: `${i * 0.08}s` }}>
            <div className={styles.metricIcon}>{m.icon}</div>
            {loading ? <div className="skeleton" style={{ width: '60%', height: 28, marginTop: 8 }} /> :
              <div className={styles.metricValue} style={{ color: m.color, fontSize: m.small ? '1.1rem' : undefined }}>{m.value}</div>
            }
            <div className={styles.metricLabel}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {(['heatmap', 'links', 'sources'] as const).map(tab => (
          <button
            key={tab}
            className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'heatmap' && '🕐 Click Heatmap'}
            {tab === 'links' && '🔗 Link Performance'}
            {tab === 'sources' && '📡 Traffic Sources'}
          </button>
        ))}
      </div>

      {/* Chart panels */}
      {activeTab === 'heatmap' && (
        <div className={`card ${styles.chartCard}`}>
          <h2 className={styles.chartTitle}>Clicks by Hour of Day (24h)</h2>
          <p className={styles.chartDesc}>Peak engagement time for your audience — all time</p>
          {loading ? <ChartSkeleton height={280} /> : (
            <>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={heatmap} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: 'rgba(232,232,240,0.45)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    interval={2}
                  />
                  <YAxis
                    tick={{ fill: 'rgba(232,232,240,0.45)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(124,106,255,0.3)', borderRadius: 10, color: '#e8e8f0' }}
                    cursor={{ fill: 'rgba(124,106,255,0.08)' }}
                    formatter={(value: number) => [`${value} clicks`, 'Clicks']}
                  />
                  <Bar
                    dataKey="clicks"
                    radius={[4, 4, 0, 0]}
                    fill="url(#barGrad)"
                    maxBarSize={28}
                  />
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a78bfa" />
                      <stop offset="100%" stopColor="#7c3aed" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>

              {/* Visual heatmap grid */}
              <div className={styles.heatmapGrid}>
                {heatmap.map(item => {
                  const intensity = item.clicks / maxHeatmapClicks;
                  return (
                    <div
                      key={item.hour}
                      className={styles.heatmapCell}
                      style={{
                        background: `rgba(124,106,255,${0.1 + intensity * 0.85})`,
                      }}
                      title={`${item.label}: ${item.clicks} clicks`}
                    >
                      <span className={styles.heatmapHour}>{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'links' && (
        <div className={`card ${styles.chartCard}`}>
          <h2 className={styles.chartTitle}>Link Performance Ranking</h2>
          <p className={styles.chartDesc}>Which links are your audience clicking most?</p>
          {loading ? <ChartSkeleton height={300} /> : linkStats.length === 0 ? (
            <NoData />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={Math.max(200, linkStats.length * 52)}>
                <BarChart data={linkStats} layout="vertical" margin={{ top: 0, right: 60, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: 'rgba(232,232,240,0.45)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="title"
                    width={140}
                    tick={{ fill: 'rgba(232,232,240,0.7)', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: string) => v.length > 18 ? v.slice(0, 18) + '…' : v}
                  />
                  <Tooltip
                    contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(124,106,255,0.3)', borderRadius: 10, color: '#e8e8f0' }}
                    formatter={(value: number, name: string) => [value.toLocaleString(), name === 'total_clicks' ? 'Total' : '7-Day']}
                  />
                  <Bar dataKey="total_clicks" fill="url(#barGrad2)" radius={[0, 4, 4, 0]} name="total_clicks" maxBarSize={24} />
                  <defs>
                    <linearGradient id="barGrad2" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#7c3aed" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>

              {/* Table */}
              <div className={styles.linkTable}>
                <div className={styles.linkTableHeader}>
                  <span>Link</span><span>Total</span><span>7 Days</span><span>Share</span>
                </div>
                {linkStats.map((l: any, i: number) => (
                  <div key={l.id} className={styles.linkTableRow}>
                    <div className={styles.linkTableName}>
                      <span className={styles.rank}>#{i + 1}</span>
                      <span>{l.icon}</span>
                      <span className={styles.linkTableTitle}>{l.title}</span>
                    </div>
                    <span className={styles.linkTableClicks}>{l.total_clicks.toLocaleString()}</span>
                    <span className={styles.linkTableWeek}>{l.week_clicks.toLocaleString()}</span>
                    <div className={styles.linkTableShare}>
                      <div className={styles.shareBar}>
                        <div className={styles.shareBarFill} style={{ width: `${l.percentage}%` }} />
                      </div>
                      <span>{l.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'sources' && (
        <div className={styles.sourcesGrid}>
          {/* Pie chart */}
          <div className={`card ${styles.chartCard}`} style={{ flex: 1, minWidth: 280 }}>
            <h2 className={styles.chartTitle}>Traffic Sources</h2>
            <p className={styles.chartDesc}>Where your visitors are coming from</p>
            {loading ? <ChartSkeleton height={260} /> : sources.length === 0 ? <NoData /> : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={sources}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="clicks"
                    nameKey="source"
                  >
                    {sources.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={SOURCE_COLORS[index % SOURCE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(124,106,255,0.3)', borderRadius: 10, color: '#e8e8f0' }}
                    formatter={(value: number, _name: any, entry: any) => [
                      `${value.toLocaleString()} clicks (${entry.payload.percentage}%)`,
                      SOURCE_LABELS[entry.payload.source] || entry.payload.source,
                    ]}
                  />
                  <Legend
                    formatter={(value: string) => SOURCE_LABELS[value] || value}
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ color: 'rgba(232,232,240,0.6)', fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Devices + source list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: 1, minWidth: 240 }}>
            {/* Source breakdown list */}
            <div className="card">
              <h3 className={styles.chartTitle} style={{ fontSize: '0.9375rem' }}>Source Breakdown</h3>
              {loading ? <ChartSkeleton height={120} /> : (
                <div className={styles.sourceList}>
                  {sources.map((s: any, i: number) => (
                    <div key={s.source} className={styles.sourceItem}>
                      <div className={styles.sourceDot} style={{ background: SOURCE_COLORS[i % SOURCE_COLORS.length] }} />
                      <span className={styles.sourceName}>{SOURCE_LABELS[s.source] || s.source}</span>
                      <span className={styles.sourceClicks}>{s.clicks.toLocaleString()}</span>
                      <span className={styles.sourcePct}>{s.percentage}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Device breakdown */}
            <div className="card">
              <h3 className={styles.chartTitle} style={{ fontSize: '0.9375rem' }}>Device Breakdown</h3>
              {loading ? <ChartSkeleton height={80} /> : (
                <div className={styles.deviceList}>
                  {devices.map((d: any, i: number) => {
                    const icons: Record<string, string> = { mobile: '📱', desktop: '💻', tablet: '📋' };
                    return (
                      <div key={d.device} className={styles.deviceItem}>
                        <span>{icons[d.device] || '🖥'}</span>
                        <span style={{ textTransform: 'capitalize' }}>{d.device}</span>
                        <div className={styles.deviceBar}>
                          <div className={styles.deviceBarFill} style={{ width: `${d.percentage}%`, background: SOURCE_COLORS[i] }} />
                        </div>
                        <span className={styles.devicePct}>{d.percentage}%</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ChartSkeleton({ height }: { height: number }) {
  return <div className="skeleton" style={{ width: '100%', height, marginTop: 16, borderRadius: 12 }} />;
}

function NoData() {
  return (
    <div style={{ textAlign: 'center', padding: '40px 24px', color: 'var(--dash-text-muted)' }}>
      <div style={{ fontSize: '2rem', marginBottom: 8 }}>📊</div>
      <p>No data yet. Share your page to start tracking clicks!</p>
    </div>
  );
}
