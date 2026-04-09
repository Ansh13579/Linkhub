'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '../auth.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Login failed'); return; }

      localStorage.setItem('lh_token', data.token);
      localStorage.setItem('lh_user', JSON.stringify(data.user));
      localStorage.setItem('lh_tenant', JSON.stringify(data.tenant));
      router.push('/dashboard');
    } catch {
      setError('Network error. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.bgGlow} />
      <div className={styles.card}>
        <div className={styles.logoWrap}>
          <Link href="/" className={styles.logoLink}>🔗 LinkHub</Link>
        </div>
        <h1 className={styles.title}>Welcome back</h1>
        <p className={styles.subtitle}>Sign in to manage your links</p>

        {/* Demo hint */}
        <div className={styles.demoHint}>
          <strong>Demo account:</strong> alex@linkhub.dev / password123
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {error && <div className={styles.errorBox}>{error}</div>}

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            className={`btn btn-primary ${styles.submitBtn}`}
            disabled={loading}
          >
            {loading ? <span className={styles.spinner} /> : null}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className={styles.switchText}>
          Don't have an account?{' '}
          <Link href="/register" className={styles.switchLink}>Create one free</Link>
        </p>

        {/* Quick demo links */}
        <div className={styles.demoAccounts}>
          <p className={styles.demoTitle}>Quick demo fill:</p>
          {[
            { label: 'Alex (Neon Dark)', email: 'alex@linkhub.dev' },
            { label: 'Sarah (Soft Pastel)', email: 'sarah@linkhub.dev' },
            { label: 'Marcus (Bold Gradient)', email: 'marcus@linkhub.dev' },
          ].map(acc => (
            <button
              key={acc.email}
              className={styles.demoBtn}
              onClick={() => setForm({ email: acc.email, password: 'password123' })}
            >
              {acc.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
