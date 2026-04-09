'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function authHeaders() {
  const token = localStorage.getItem('lh_token');
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

const THEME_PRESETS = [
  { name: '🌑 Neon Dark', primary_color: '#A855F7', secondary_color: '#06B6D4', background_color: '#0a0a0f', text_color: '#f0f0ff', card_color: 'rgba(168,85,247,0.1)', font_family: 'Space Grotesk', button_style: 'outline', button_radius: '8px', background_type: 'gradient', background_value: 'linear-gradient(135deg, #0a0a0f 0%, #120024 100%)' },
  { name: '🌸 Soft Pastel', primary_color: '#8B5CF6', secondary_color: '#EC4899', background_color: '#faf5ff', text_color: '#1e1b4b', card_color: 'rgba(139,92,246,0.08)', font_family: 'DM Sans', button_style: 'soft', button_radius: '24px', background_type: 'solid', background_value: '#faf5ff' },
  { name: '🔥 Bold Gradient', primary_color: '#ffffff', secondary_color: '#fbbf24', background_color: '#ff6b6b', text_color: '#ffffff', card_color: 'rgba(255,255,255,0.15)', font_family: 'Outfit', button_style: 'filled', button_radius: '16px', background_type: 'gradient', background_value: 'linear-gradient(135deg, #ff6b6b, #ee0979, #7c3aed)' },
  { name: '🌊 Ocean Breeze', primary_color: '#06B6D4', secondary_color: '#0EA5E9', background_color: '#0c1929', text_color: '#e0f7fa', card_color: 'rgba(6,182,212,0.1)', font_family: 'Inter', button_style: 'filled', button_radius: '12px', background_type: 'gradient', background_value: 'linear-gradient(180deg, #0c1929, #0a2a3d)' },
  { name: '⬜ Minimal Light', primary_color: '#111827', secondary_color: '#6B7280', background_color: '#ffffff', text_color: '#111827', card_color: 'rgba(17,24,39,0.05)', font_family: 'Inter', button_style: 'outline', button_radius: '6px', background_type: 'solid', background_value: '#ffffff' },
];

const FONTS = ['Inter', 'Space Grotesk', 'DM Sans', 'Outfit'];
const BTN_STYLES = ['filled', 'outline', 'soft'];
const BTN_RADII = [
  { label: 'Sharp', value: '4px' },
  { label: 'Rounded', value: '12px' },
  { label: 'Pill', value: '999px' },
  { label: 'Custom', value: '24px' },
];

export default function SettingsPage() {
  const [theme, setTheme] = useState<any>(null);
  const [profile, setProfile] = useState<any>({ name: '', bio: '', avatar_url: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [activeSection, setActiveSection] = useState<'profile' | 'theme'>('theme');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  useEffect(() => {
    const token = localStorage.getItem('lh_token');
    fetch(`${API_URL}/api/tenants/profile`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        setTheme({
          primary_color: data.primary_color,
          secondary_color: data.secondary_color,
          background_color: data.background_color,
          text_color: data.text_color,
          card_color: data.card_color,
          font_family: data.font_family,
          button_style: data.button_style,
          button_radius: data.button_radius,
          background_type: data.background_type,
          background_value: data.background_value,
        });
        setProfile({ name: data.name, bio: data.bio || '', avatar_url: data.avatar_url || '' });
        setLoading(false);
      });
  }, []);

  function applyPreset(preset: typeof THEME_PRESETS[0]) {
    const { name, ...themeVals } = preset;
    setTheme((prev: any) => ({ ...prev, ...themeVals }));
  }

  async function saveTheme() {
    setSaving(true);
    const res = await fetch(`${API_URL}/api/tenants/theme`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(theme),
    });
    if (res.ok) showToast('Theme saved! ✓');
    setSaving(false);
  }

  async function saveProfile() {
    setSaving(true);
    const res = await fetch(`${API_URL}/api/tenants/profile`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(profile),
    });
    if (res.ok) {
      const updated = await res.json();
      localStorage.setItem('lh_tenant', JSON.stringify({ ...JSON.parse(localStorage.getItem('lh_tenant') || '{}'), ...updated }));
      showToast('Profile updated! ✓');
    }
    setSaving(false);
  }

  if (loading) return <div style={{ padding: 40 }}><div className="skeleton" style={{ height: 400 }} /></div>;

  const previewBg = theme?.background_type === 'gradient' ? theme.background_value : theme?.background_color;

  return (
    <div className={styles.page}>
      {toast && <div className={styles.toast}>{toast}</div>}

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Appearance</h1>
          <p className={styles.subtitle}>Customize your page theme and profile</p>
        </div>
      </div>

      {/* Section tabs */}
      <div className={styles.sectionTabs}>
        <button className={`${styles.sectionTab} ${activeSection === 'theme' ? styles.sectionTabActive : ''}`} onClick={() => setActiveSection('theme')}>
          🎨 Theme
        </button>
        <button className={`${styles.sectionTab} ${activeSection === 'profile' ? styles.sectionTabActive : ''}`} onClick={() => setActiveSection('profile')}>
          👤 Profile
        </button>
      </div>

      <div className={styles.settingsLayout}>
        {/* Left: controls */}
        <div className={styles.controls}>
          {activeSection === 'theme' && theme && (
            <>
              {/* Theme presets */}
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Quick Presets</h2>
                <div className={styles.presetGrid}>
                  {THEME_PRESETS.map(preset => (
                    <button
                      key={preset.name}
                      className={styles.presetBtn}
                      onClick={() => applyPreset(preset)}
                      style={{ background: preset.background_type === 'gradient' ? preset.background_value : preset.background_color }}
                    >
                      <div className={styles.presetSwatch} style={{ background: preset.primary_color }} />
                      <span style={{ color: preset.text_color, fontSize: '0.7rem', fontWeight: 600 }}>
                        {preset.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Colors */}
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Colors</h2>
                <div className={styles.colorGrid}>
                  {[
                    { label: 'Primary', key: 'primary_color' },
                    { label: 'Secondary', key: 'secondary_color' },
                    { label: 'Background', key: 'background_color' },
                    { label: 'Text', key: 'text_color' },
                  ].map(c => (
                    <div key={c.key} className={styles.colorPicker}>
                      <label className={styles.colorLabel}>{c.label}</label>
                      <div className={styles.colorInputWrap}>
                        <input
                          type="color"
                          value={theme[c.key] || '#000000'}
                          onChange={e => setTheme((prev: any) => ({ ...prev, [c.key]: e.target.value }))}
                          className={styles.colorInput}
                          aria-label={`${c.label} color picker`}
                        />
                        <span className={styles.colorHex}>{theme[c.key]}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Font */}
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Typography</h2>
                <div className={styles.fontGrid}>
                  {FONTS.map(font => (
                    <button
                      key={font}
                      className={`${styles.fontBtn} ${theme.font_family === font ? styles.fontBtnActive : ''}`}
                      onClick={() => setTheme((prev: any) => ({ ...prev, font_family: font }))}
                      style={{ fontFamily: font }}
                    >
                      {font}
                    </button>
                  ))}
                </div>
              </div>

              {/* Button style */}
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Button Style</h2>
                <div className={styles.btnStyleGrid}>
                  {BTN_STYLES.map(s => (
                    <button
                      key={s}
                      className={`${styles.btnStyleBtn} ${theme.button_style === s ? styles.btnStyleActive : ''}`}
                      onClick={() => setTheme((prev: any) => ({ ...prev, button_style: s }))}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>

                <div style={{ marginTop: 12 }}>
                  <p className={styles.subLabel}>Corner Radius</p>
                  <div className={styles.radiusGrid}>
                    {BTN_RADII.map(r => (
                      <button
                        key={r.value}
                        className={`${styles.radiusBtn} ${theme.button_radius === r.value ? styles.radiusBtnActive : ''}`}
                        onClick={() => setTheme((prev: any) => ({ ...prev, button_radius: r.value }))}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px' }} onClick={saveTheme} disabled={saving}>
                {saving ? 'Saving...' : '💾 Save Theme'}
              </button>
            </>
          )}

          {activeSection === 'profile' && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Profile Info</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="profile-name">Display Name</label>
                  <input id="profile-name" type="text" className="form-input" value={profile.name} onChange={e => setProfile((p: any) => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="profile-bio">Bio</label>
                  <textarea id="profile-bio" className="form-input" style={{ minHeight: 80, resize: 'vertical' }} value={profile.bio} onChange={e => setProfile((p: any) => ({ ...p, bio: e.target.value }))} placeholder="Tell your audience about yourself..." maxLength={160} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--dash-text-muted)' }}>{(profile.bio || '').length}/160</span>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="profile-avatar">Avatar URL</label>
                  <input id="profile-avatar" type="text" className="form-input" value={profile.avatar_url} onChange={e => setProfile((p: any) => ({ ...p, avatar_url: e.target.value }))} placeholder="https://..." />
                </div>
                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px' }} onClick={saveProfile} disabled={saving}>
                  {saving ? 'Saving...' : '💾 Save Profile'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: live preview */}
        <div className={styles.previewPane}>
          <div className={styles.previewHeader}>
            <div className={styles.previewDot} style={{ background: '#ef4444' }} />
            <div className={styles.previewDot} style={{ background: '#f59e0b' }} />
            <div className={styles.previewDot} style={{ background: '#22c55e' }} />
            <span className={styles.previewUrl}>linkhub.io/t/you</span>
          </div>
          {theme && (
            <div
              className={styles.previewPage}
              style={{
                background: previewBg,
                color: theme.text_color,
                fontFamily: `'${theme.font_family}', sans-serif`,
              }}
            >
              <img
                src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=preview`}
                alt=""
                className={styles.previewAvatar}
              />
              <p className={styles.previewName} style={{ color: theme.text_color }}>
                {profile.name || 'Your Name'}
              </p>
              <p className={styles.previewBio} style={{ color: `${theme.text_color}99` }}>
                {profile.bio || 'Your bio goes here...'}
              </p>
              {['Link One', 'Link Two', 'Link Three'].map((label, idx) => {
                const btnBase = {
                  borderRadius: theme.button_radius,
                  fontFamily: `'${theme.font_family}', sans-serif`,
                  animationDelay: `${idx * 0.08}s`,
                };
                const styleMap: Record<string, React.CSSProperties> = {
                  filled: { ...btnBase, background: theme.primary_color, color: theme.background_color },
                  outline: { ...btnBase, background: 'transparent', border: `2px solid ${theme.primary_color}`, color: theme.primary_color },
                  soft: { ...btnBase, background: theme.card_color, color: theme.text_color, border: `1px solid rgba(255,255,255,0.1)` },
                };
                return (
                  <div key={label} className={styles.previewBtn} style={styleMap[theme.button_style] || styleMap.filled}>
                    {label}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
