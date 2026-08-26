import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { submitAccessRequest } from '../../services/accessRequests-service';
import './access-requests.css';

export default function RequestAccess() {
  const { t } = useTranslation();
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
      setError(t('accessRequests.genericError'));
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="acr-page">
        <div className="acr-card">
          <h1 className="acr-title">{t('accessRequests.requestSentTitle')}</h1>
          <p className="acr-subtitle">
            {t('accessRequests.requestSentSubtitle')}
          </p>
          <Link to="/login" className="acr-link">
            {t('accessRequests.backToLogin')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="acr-page">
      <div className="acr-card">
        <h1 className="acr-title">{t('accessRequests.requestAccessTitle')}</h1>
        <p className="acr-subtitle">{t('accessRequests.requestAccessSubtitle')}</p>

        {error && <div className="acr-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="acr-field">
            <label className="acr-label">{t('accessRequests.fieldEmail')}</label>
            <input
              type="email"
              className="acr-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="acr-button" disabled={loading}>
            {loading ? t('accessRequests.sending') : t('accessRequests.requestAccessButton')}
          </button>
        </form>

        <Link to="/login" className="acr-link">
          {t('accessRequests.alreadyHaveAccount')}
        </Link>
      </div>
    </div>
  );
}