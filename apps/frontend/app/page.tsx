/* ============================================================
   LinkHub Landing Page
   ============================================================ */

'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

const DEMO_THEMES = [
  { name: 'Neon Dark', bg: 'linear-gradient(135deg, #0a0a0f, #120024)', primary: '#A855F7', text: '#f0f0ff' },
  { name: 'Soft Pastel', bg: '#faf5ff', primary: '#8B5CF6', text: '#1e1b4b' },
  { name: 'Bold Gradient', bg: 'linear-gradient(135deg, #ff6b6b, #ee0979, #7c3aed)', primary: '#fff', text: '#fff' },
];

const FEATURES = [
  { icon: '🎨', title: 'Theming Engine', desc: 'Dynamic CSS variable injection. Create visually distinct pages with one click.' },
  { icon: '⚡', title: 'Drag & Drop Links', desc: 'Reorder your links with buttery-smooth drag and drop — mobile friendly.' },
  { icon: '📊', title: 'Analytics Dashboard', desc: 'Click heatmaps, traffic sources, and link performance rankings in real time.' },
  { icon: '🔒', title: 'Multi-Tenant Security', desc: 'Row-Level Security + JWT tenant scoping. Zero cross-tenant data leakage.' },
  { icon: '📱', title: 'Mobile First', desc: '80% of traffic comes from mobile. We built for thumbs, not cursors.' },
  { icon: '🚀', title: 'White Label Ready', desc: 'Subdomain routing, custom domains, and fully brandable for your clients.' },
];

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!heroRef.current) return;
      const { left, top, width, height } = heroRef.current.getBoundingClientRect();
      const x = ((e.clientX - left) / width) * 100;
      const y = ((e.clientY - top) / height) * 100;
      heroRef.current.style.setProperty('--mouse-x', `${x}%`);
      heroRef.current.style.setProperty('--mouse-y', `${y}%`);
    };
    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className={styles.page}>
      {/* Navigation */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>🔗</span>
            <span className={styles.logoText}>LinkHub</span>
          </div>
          <div className={styles.navLinks}>
            <Link href="/t/alexdesigns" className={styles.navLink}>Demo</Link>
            <Link href="/login" className={styles.navLink}>Sign In</Link>
            <Link href="/register" className={styles.navCta}>Get Started Free</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.hero} ref={heroRef}>
        <div className={styles.heroGlow} />
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>✨ Multi-Tenant Platform</div>
          <h1 className={styles.heroTitle}>
            Your Link in Bio,<br />
            <span className={styles.heroGradient}>Elevated</span>
          </h1>
          <p className={styles.heroDesc}>
            One beautiful page for all your links. Custom themes, real-time analytics,
            and enterprise-grade security — built for creators who mean business.
          </p>
          <div className={styles.heroCtas}>
            <Link href="/register" className={styles.ctaPrimary}>
              Create Your Page
              <span>→</span>
            </Link>
            <Link href="/t/alexdesigns" className={styles.ctaSecondary}>
              View Live Demo
            </Link>
          </div>
          <div className={styles.heroStats}>
            <div className={styles.heroStat}><strong>5</strong> Demo Tenants</div>
            <div className={styles.heroStatDivider} />
            <div className={styles.heroStat}><strong>3</strong> Themes</div>
            <div className={styles.heroStatDivider} />
            <div className={styles.heroStat}><strong>50k+</strong> Mock Clicks</div>
          </div>
        </div>

        {/* Preview cards */}
        <div className={styles.heroPreview}>
          {DEMO_THEMES.map((theme, i) => (
            <div
              key={theme.name}
              className={styles.previewCard}
              style={{
                background: theme.bg,
                '--card-primary': theme.primary,
                '--card-text': theme.text,
                animationDelay: `${i * 0.15}s`,
              } as any}
            >
              <div className={styles.previewAvatar} />
              <div className={styles.previewName} />
              <div className={styles.previewBtn} style={{ background: theme.primary }} />
              <div className={styles.previewBtn} style={{ background: theme.primary, opacity: 0.7 }} />
              <div className={styles.previewBtn} style={{ background: theme.primary, opacity: 0.5 }} />
              <div className={styles.previewLabel}>{theme.name}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className={styles.features}>
        <div className={styles.featuresInner}>
          <h2 className={styles.sectionTitle}>Everything you need to shine</h2>
          <p className={styles.sectionDesc}>
            Built from the ground up with multi-tenant security, performance, and aesthetics as first-class concerns.
          </p>
          <div className={styles.featuresGrid}>
            {FEATURES.map((f, i) => (
              <div key={f.title} className={styles.featureCard} style={{ animationDelay: `${i * 0.1}s` }}>
                <div className={styles.featureIcon}>{f.icon}</div>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo accounts */}
      <section className={styles.demo}>
        <div className={styles.demoInner}>
          <h2 className={styles.sectionTitle}>Try Live Demo Profiles</h2>
          <p className={styles.sectionDesc}>Each tenant has a unique theme. Click to view their profile page.</p>
          <div className={styles.demoGrid}>
            {[
              { slug: 'alexdesigns', name: 'Alex Chen', role: 'UI/UX Designer', theme: 'Neon Dark', color: '#A855F7' },
              { slug: 'sarahcodes', name: 'Sarah Park', role: 'Full-Stack Developer', theme: 'Soft Pastel', color: '#8B5CF6' },
              { slug: 'marcusbrand', name: 'Marcus Wright', role: 'Brand Strategist', theme: 'Bold Gradient', color: '#ee0979' },
              { slug: 'lunafitness', name: 'Luna Rodriguez', role: 'Personal Trainer', theme: 'Ocean Breeze', color: '#06B6D4' },
              { slug: 'quantumstudio', name: 'Quantum Studio', role: 'Indie Game Studio', theme: 'Minimal Light', color: '#111827' },
            ].map((t) => (
              <Link key={t.slug} href={`/t/${t.slug}`} className={styles.demoCard}>
                <div className={styles.demoAvatar} style={{ background: t.color }} />
                <div>
                  <div className={styles.demoName}>{t.name}</div>
                  <div className={styles.demoRole}>{t.role}</div>
                  <span className={styles.demoBadge} style={{ backgroundColor: `${t.color}20`, color: t.color }}>
                    {t.theme}
                  </span>
                </div>
                <span className={styles.demoArrow}>→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className={styles.ctaBanner}>
        <div className={styles.ctaBannerInner}>
          <h2>Ready to build your LinkHub?</h2>
          <p>Takes 30 seconds. No credit card required.</p>
          <Link href="/register" className={styles.ctaPrimary}>
            Create Your Free Page →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>🔗</span>
            <span className={styles.logoText}>LinkHub</span>
          </div>
          <p className={styles.footerText}>
            Built for the Purple Merit Technologies challenge • Multi-Tenant Link in Bio Platform
          </p>
        </div>
      </footer>
    </div>
  );
}
