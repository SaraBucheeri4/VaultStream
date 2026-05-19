// Login.jsx — Admin-only sign-in for FINTECH_OS · Core Engine
// Cosmetic — accepts any non-empty credentials. Press "Demo admin" to skip.

import React, { useState } from 'react';
import { Icon } from './Icon.jsx';

export default function Login({ onAuth }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfa, setMfa] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);  // 1 = creds, 2 = mfa

  const submitCreds = async (e) => {
    e?.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Admin ID and password are both required.');
      return;
    }
    if (!/@/.test(email)) {
      setError('Use your admin email or operator ID (must contain "@").');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        const { token } = await res.json();
        sessionStorage.setItem('fos_token', token);
        await fetch('/api/otp/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, purpose: 'TWO_FACTOR_AUTH' }),
        });
        setStep(2);
      } else if (res.status === 401) {
        setError('Invalid credentials. Check your email and password.');
      } else {
        setError('Server error — try again.');
      }
    } catch {
      setError('Cannot reach the server. Check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const submitMfa = async (e) => {
    e?.preventDefault();
    setError('');
    if (mfa.length < 6) {
      setError('Enter the 6-digit code sent to your email.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose: 'TWO_FACTOR_AUTH', code: mfa }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        onAuth({ email, role: 'admin', token: sessionStorage.getItem('fos_token') });
      } else {
        setError(data.message || 'Invalid code. Try again.');
        setMfa('');
      }
    } catch {
      setError('Cannot reach the server. Check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const useDemo = () => {
    onAuth({ email: 'sky.chen@fintech.os', role: 'admin', demo: true });
  };

  return (
    <div className="login-shell">
      {/* Background dot grid */}
      <div className="login-grid" aria-hidden />

      <div className="login-card">
        <header className="login-head">
          <div className="login-brand">VAULT STASH</div>
          <div className="login-brand-sub">Secure Access</div>
        </header>

        <div className="login-body">
          <div className="login-title">
            <h2>Admin sign in</h2>
            <p>Authorized operators only. Sessions are logged and audited.</p>
          </div>

          {step === 1 ? (
            <form onSubmit={submitCreds} className="login-form" autoComplete="off">
              <label className="login-field">
                <span>Admin email or operator ID</span>
                <div className="login-input">
                  <Icon name="key-round" size={15} />
                  <input
                    type="text"
                    placeholder="operator@fintech.os"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoFocus
                  />
                </div>
              </label>

              <label className="login-field">
                <span>Password</span>
                <div className="login-input">
                  <Icon name="shield-check" size={15} />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <button type="button" className="login-eye"
                          onClick={() => setShowPwd(s => !s)}
                          title={showPwd ? 'Hide' : 'Show'}>
                    <Icon name="eye" size={14} />
                  </button>
                </div>
              </label>

              {error && <div className="login-error"><Icon name="alert-triangle" size={13} /> {error}</div>}

              <div className="login-row">
                <label className="login-check">
                  <input type="checkbox" defaultChecked />
                  <span>Trust this device for 8 hours</span>
                </label>
                <a className="login-link">Recovery</a>
              </div>

              <button type="submit" className="login-submit" disabled={submitting}>
                {submitting ? 'Verifying…' : 'Continue'}
                {!submitting && <Icon name="chevron-right" size={15} />}
              </button>

              <div className="login-divider"><span>or</span></div>

              <button type="button" className="login-sso" onClick={useDemo}>
                <Icon name="sparkles" size={15} />
                Continue with demo admin
              </button>
            </form>
          ) : (
            <form onSubmit={submitMfa} className="login-form" autoComplete="off">
              <div className="login-mfa-head">
                <div className="login-mfa-icon"><Icon name="shield-check" size={20} /></div>
                <div>
                  <div className="login-mfa-title">Two-factor verification</div>
                  <div className="login-mfa-sub">We sent a 6-digit code to <strong>{email}</strong>. It expires in 5 minutes.</div>
                </div>
              </div>

              <div className="login-otp">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className={`login-otp__cell ${mfa.length === i ? 'on' : ''} ${mfa.length > i ? 'filled' : ''}`}>
                    {mfa[i] || ''}
                  </div>
                ))}
                <input
                  className="login-otp__hidden"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={mfa}
                  onChange={e => setMfa(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  autoFocus
                />
              </div>

              {error && <div className="login-error"><Icon name="alert-triangle" size={13} /> {error}</div>}

              <button type="submit" className="login-submit" disabled={submitting}>
                {submitting ? 'Verifying…' : 'Verify and sign in'}
                {!submitting && <Icon name="check" size={15} />}
              </button>

              <button type="button" className="login-back" onClick={() => { setStep(1); setMfa(''); setError(''); }}>
                <Icon name="chevron-left" size={14} /> Use a different account
              </button>
            </form>
          )}

          <footer className="login-foot">
            <span><Icon name="shield-check" size={12} /> SSO via Okta or SAML available for org admins</span>
            <span>Need access? Contact <a className="login-link">security@fintech.os</a></span>
          </footer>
        </div>
      </div>
    </div>
  );
}
