'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '../auth.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState({ name: '', slug: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [slugTaken, setSlugTaken] = useState(false);

  function handleSlugInput(value: string) {
    const clean = value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    setForm(f => ({ ...f, slug: clean }));
    setSlugTaken(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (step === 1) { setStep(2); return; }
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.status === 409 && data.error?.includes('Slug')) {
        setSlugTaken(true);
        setStep(1);
        setError('That username is already taken. Try another.');
        return;
      }
      if (!res.ok) { setError(data.error || 'Registration failed'); return; }

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

        {/* Step indicator */}
        <div className={styles.steps}>
          <div className={`${styles.step} ${step >= 1 ? styles.stepActive : ''}`}>1</div>
          <div className={styles.stepLine} />
          <div className={`${styles.step} ${step >= 2 ? styles.stepActive : ''}`}>2</div>
        </div>

        <h1 className={styles.title}>
          {step === 1 ? 'Claim your username' : 'Set up your account'}
        </h1>
        <p className={styles.subtitle}>
          {step === 1 ? 'Choose your unique LinkHub URL' : 'Almost there — just a few more details'}
        </p>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {error && <div className={styles.errorBox}>{error}</div>}

          {step === 1 && (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="name">Your Name</label>
                <input
                  id="name"
                  type="text"
                  className="form-input"
                  placeholder="Jane Smith"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="slug">Username / URL</label>
                <div className={styles.slugWrap}>
                  <span className={styles.slugPrefix}>linkhub.io/t/</span>
                  <input
                    id="slug"
                    type="text"
                    className={`form-input ${styles.slugInput} ${slugTaken ? styles.inputError : ''}`}
                    placeholder="yourname"
                    value={form.slug}
                    onChange={e => handleSlugInput(e.target.value)}
                    minLength={3}
                    maxLength={30}
                    pattern="[a-z0-9_-]+"
                    required
                  />
                </div>
                {form.slug && (
                  <span className={styles.slugPreview}>
                    Your page: <strong>/t/{form.slug}</strong>
                  </span>
                )}
              </div>
              <button
                id="register-step1-btn"
                type="submit"
                className={`btn btn-primary ${styles.submitBtn}`}
                disabled={!form.name || form.slug.length < 3}
              >
                Continue →
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="email">Email Address</label>
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
                  placeholder="At least 8 characters"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
              <div className={styles.btnRow}>
                <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>
                  ← Back
                </button>
                <button
                  id="register-submit-btn"
                  type="submit"
                  className={`btn btn-primary ${styles.submitBtn}`}
                  disabled={loading || !form.email || form.password.length < 8}
                >
                  {loading ? <span className={styles.spinner} /> : null}
                  {loading ? 'Creating...' : 'Create My Page'}
                </button>
              </div>
            </>
          )}
        </form>

        <p className={styles.switchText}>
          Already have an account?{' '}
          <Link href="/login" className={styles.switchLink}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
