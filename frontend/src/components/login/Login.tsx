import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, completeNewPassword } from '../lib/cognito';
import type { AuthFieldProps, AuthCardProps } from '../types/auth';
import './Login.css';

function AuthField({ label, type, value, onChange, required }: AuthFieldProps) {
  return (
    <div className="login-field">
      <label className="login-label">{label}</label>
      <input
        type={type}
        className="login-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
    </div>
  );
}

function AuthCard({ title, subtitle, error, children }: AuthCardProps) {
  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">{title}</h1>
        <p className="login-subtitle">{subtitle}</p>
        {error && <div className="login-error">{error}</div>}
        {children}
      </div>
    </div>
  );
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [session, setSession] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);

      if (result.challenge === 'NEW_PASSWORD_REQUIRED' && result.session) {
        setSession(result.session);
        setLoading(false);
        return;
      }

      if (result.accessToken) {
        localStorage.setItem('accessToken', result.accessToken);
        navigate('/dashboard');
      }
    } catch {
      setError('Incorrect email or password.');
      setLoading(false);
    }
  }

  async function handleSetNewPassword(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!session) return;
      const accessToken = await completeNewPassword(email, newPassword, session);
      if (accessToken) {
        localStorage.setItem('accessToken', accessToken);
        navigate('/dashboard');
      }
    } catch {
      setError('Could not set new password. Make sure it meets the requirements.');
      setLoading(false);
    }
  }

  if (session) {
    return (
      <AuthCard
        title="Set a new password"
        subtitle="This is your first login — choose a permanent password."
        error={error}
      >
        <form onSubmit={handleSetNewPassword}>
          <AuthField label="New Password" type="password" value={newPassword} onChange={setNewPassword} required />
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Setting password...' : 'Set password'}
          </button>
        </form>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Mini ERP" subtitle="Sign in to your account" error={error}>
      <form onSubmit={handleLogin}>
        <AuthField label="Email" type="email" value={email} onChange={setEmail} required />
        <AuthField label="Password" type="password" value={password} onChange={setPassword} required />
        <button type="submit" className="login-button" disabled={loading}>
          {loading ? 'Logging in...' : 'Log in'}
        </button>
      </form>
    </AuthCard>
  );
}