import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authenticate, currentUser, migrateGuest } from './services/lists';
export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => { currentUser().then(user => setSignedIn(!!user)).catch(err => setError(err.message)); }, []);
  async function submit(signup) {
    setBusy(true); setError('');
    try {
      if (signedIn) await migrateGuest();
      else await authenticate(email.trim(), password, name.trim(), signup);
      navigate('/');
    } catch (err) {
      setError(err.message);
      try { setSignedIn(!!await currentUser()); } catch { /* Keep original error. */ }
    } finally { setBusy(false); }
  }
  return <main>
    <h2>Login / Signup</h2>
    <p>Continue as a guest to save lists in this browser. Sign in to save them to your account.</p>
    {signedIn ? <p>You are signed in. Retry importing any remaining guest lists before continuing.</p> : <div>
      <label>Display name (for signup)<input autoComplete="nickname" value={name} onChange={e => setName(e.target.value)} /></label>
      <label>Email<input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} /></label>
      <label>Password (at least 8 characters)<input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} /></label>
    </div>}
    {error && <p role="alert">{error} Your remaining guest lists are still saved in this browser.</p>}
    <div>
      <button disabled={busy} onClick={() => submit(false)}>{signedIn ? 'Retry import' : 'Login'}</button>
      {!signedIn && <button disabled={busy} onClick={() => submit(true)}>Sign Up</button>}
      <Link to="/">Continue to lists</Link>
    </div>
  </main>;
}
