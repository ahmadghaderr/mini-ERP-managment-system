import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { submitAccessRequest } from '../../services/accessRequests-service';
import './access-requests.css';

export default function RequestAccess() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await submitAccessRequest(email);
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="acr-page">
        <div className="acr-card">
          <h1 className="acr-title">Request sent</h1>
          <p className="acr-subtitle">
            An admin will review your request. You'll receive an email with login details once approved.
          </p>
          <Link to="/login" className="acr-link">
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="acr-page">
      <div className="acr-card">
        <h1 className="acr-title">Request Access</h1>
        <p className="acr-subtitle">Enter your email — an admin will review and approve your account.</p>

        {error && <div className="acr-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="acr-field">
            <label className="acr-label">Email</label>
            <input
              type="email"
              className="acr-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="acr-button" disabled={loading}>
            {loading ? 'Sending...' : 'Request Access'}
          </button>
        </form>

        <Link to="/login" className="acr-link">
          Already have an account? Log in
        </Link>
      </div>
    </div>
  );
}