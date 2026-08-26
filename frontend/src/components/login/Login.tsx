import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { login, completeNewPassword } from "../../lib/cognito";
import type { AuthFieldProps, AuthCardProps } from "../../types/auth";
import "./Login.css";

function AuthField({ label, type, value, onChange, required }: AuthFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordField = type === "password";
  const inputType = isPasswordField && showPassword ? "text" : type;

  return (
    <div className="login-field">
      <label className="login-label">{label}</label>
      <div className="login-input-wrapper">
        <input
          type={inputType}
          className={`login-input ${isPasswordField ? "login-input--has-toggle" : ""}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
        />
        {isPasswordField && (
          <button
            type="button"
            className="login-password-toggle"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 11 8 11 8a13.16 13.16 0 0 1-1.67 2.68" />
                <path d="M6.61 6.61A13.526 13.526 0 0 0 1 12s4 8 11 8a9.74 9.74 0 0 0 5.39-1.61" />
                <line x1="2" y1="2" x2="22" y2="22" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function AuthCard({ title, subtitle, error, children }: AuthCardProps) {
  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-logo-icon">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2 2 7l10 5 10-5-10-5Z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 className="login-title">{title}</h1>
          <p className="login-subtitle">{subtitle}</p>
        </div>
        {error && <div className="login-error">{error}</div>}
        {children}
      </div>
    </div>
  );
}

export default function Login() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [session, setSession] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(email, password);

      if (result.challenge === "NEW_PASSWORD_REQUIRED" && result.session) {
        setSession(result.session);
        setLoading(false);
        return;
      }

      if (result.accessToken && result.idToken) {
        localStorage.setItem("accessToken", result.accessToken);
        localStorage.setItem("idToken", result.idToken);
        navigate("/dashboard");
      }
    } catch {
      setError(t("login.incorrectCredentials"));
      setLoading(false);
    }
  }

  async function handleSetNewPassword(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!session) return;
      const result = await completeNewPassword(email, newPassword, session);
      if (result.accessToken && result.idToken) {
        localStorage.setItem("accessToken", result.accessToken);
        localStorage.setItem("idToken", result.idToken);
        navigate("/dashboard");
      }
    } catch {
      setError(t("login.passwordRequirementsError"));
      setLoading(false);
    }
  }

  if (session) {
    return (
      <AuthCard
        title={t("login.newPasswordTitle")}
        subtitle={t("login.newPasswordSubtitle")}
        error={error}
      >
        <form onSubmit={handleSetNewPassword}>
          <AuthField
            label={t("login.newPasswordLabel")}
            type="password"
            value={newPassword}
            onChange={setNewPassword}
            required
          />
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? t("login.settingPassword") : t("login.setPassword")}
          </button>
        </form>
      </AuthCard>
    );
  }

  return (
    <AuthCard title={t("login.title")} subtitle={t("login.subtitle")} error={error}>
      <form onSubmit={handleLogin}>
        <AuthField
          label={t("login.emailLabel")}
          type="email"
          value={email}
          onChange={setEmail}
          required
        />
        <AuthField
          label={t("login.passwordLabel")}
          type="password"
          value={password}
          onChange={setPassword}
          required
        />
        <button type="submit" className="login-button" disabled={loading}>
          {loading ? t("login.signingIn") : t("login.signIn")}
        </button>
      </form>
    </AuthCard>
  );
}