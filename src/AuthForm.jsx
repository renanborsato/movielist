import { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { authenticate, currentUser, migrateGuest } from './services/lists';
import './AuthForm.css';

export default function AuthForm({ signup = false }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [signedIn, setSignedIn] = useState(null);
  useEffect(() => {
    let active = true;
    currentUser().then(user => { if (active) setSignedIn(!!user); })
      .catch(() => { if (active) { setSignedIn(false); setError('auth_error'); } });
    return () => { active = false; };
  }, []);

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setError('');
    if (signup && password !== confirmation) {
      setError('password_mismatch');
      return;
    }
    setBusy(true);
    let signedIn = false;
    try {
      signedIn = !!await currentUser();
      if (signedIn) await migrateGuest();
      else await authenticate(email.trim(), password, username.trim(), signup);
      navigate('/');
    } catch (err) {
      try { signedIn = !!await currentUser(); } catch { /* Keep the original failure. */ }
      setSignedIn(signedIn);
      const importKey = ['import_session_error', 'import_permission_error', 'import_configuration_error', 'import_rate_limit', 'import_changed_error', 'guest_data_error'].includes(err.message) ? err.message : 'auth_import_error';
      setError(signedIn ? importKey : err.code === 409 ? 'auth_account_exists' : err.code === 401 ? 'auth_invalid_credentials' : 'auth_error');
    } finally {
      setBusy(false);
    }
  }

  return <main className="auth-page">
    <h2>{t(signedIn ? 'import_guest_lists' : signup ? 'sign_up' : 'login')}</h2>
    <form className="auth-form" onSubmit={submit}>
      {signedIn ? <p>{t('import_help')}</p> : <>
      {signup && <label htmlFor="auth-username">{t('username')}
        <input id="auth-username" name="username" autoComplete="username" required maxLength={128} pattern={'.*\\S.*'} value={username} onChange={e => setUsername(e.target.value)} />
      </label>}
      <label htmlFor="auth-email">{t('email')}
        <input id="auth-email" name="email" type="email" autoComplete={signup ? 'email' : 'username'} required value={email} onChange={e => setEmail(e.target.value)} />
      </label>
      <label htmlFor="auth-password">{t('password')}
        <input id="auth-password" name="password" type="password" autoComplete={signup ? 'new-password' : 'current-password'} required minLength={signup ? 8 : undefined} value={password} onChange={e => setPassword(e.target.value)} />
      </label>
      {signup && <label htmlFor="auth-confirmation">{t('confirm_password')}
        <input id="auth-confirmation" name="confirmation" type="password" autoComplete="new-password" required minLength={8} value={confirmation} onChange={e => setConfirmation(e.target.value)} />
      </label>}
      </>}
      {error && <p role="alert">{t(error)}</p>}
      <button type="submit" disabled={busy || signedIn === null}>{t(busy ? 'please_wait' : signedIn ? 'retry_import' : signup ? 'sign_up' : 'log_in')}</button>
    </form>
    {signedIn && <p><Link to="/">{t('continue_without_import')}</Link></p>}
    <p><Trans i18nKey={signup ? 'have_account' : 'no_account'} components={{ accountLink: <Link to={signup ? '/login' : '/signup'} /> }} /></p>
  </main>;
}
