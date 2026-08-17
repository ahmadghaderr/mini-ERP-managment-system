import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const FAKE_USERS = [
  { email: 'admin@erp.com', password: 'admin123', fullName: 'Ahmad Admin', role: 'admin' },
  { email: 'manager@erp.com', password: 'manager123', fullName: 'Sara Manager', role: 'warehouse_manager' },
  { email: 'staff@erp.com', password: 'staff123', fullName: 'Ali Staff', role: 'staff' },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      const match = FAKE_USERS.find(
        (u) => u.email === email && u.password === password
      );

      if (match) {
        localStorage.setItem('currentUser', JSON.stringify(match));
        navigate('/dashboard');
      } else {
        setError('Invalid email or password. Please try again.');
        setLoading(false);
      }
    }, 800);
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-logo-icon">M</div>
          <h1 className="login-title">Mini ERP</h1>
          <p className="login-subtitle">Smart warehouse management</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="login-field">
            <label className="login-label">Email Address</label>
            <div className="login-input-wrapper">
              <input
                type="email"
                className="login-input"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="login-field">
            <label className="login-label">Password</label>
            <div className="login-input-wrapper">
              <input
                type="password"
                className="login-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}