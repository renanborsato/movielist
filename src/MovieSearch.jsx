import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { movieFetch } from './services/tmdb';

export default function MovieSearch({ id, label, onSelect, adding = false }) {
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const version = useRef(0);
  const language = { en: 'en-US', es: 'es-ES', pt: 'pt-BR' }[i18n.language] || 'en-US';

  useEffect(() => {
    if (query.trim().length < 2) return;
    const controller = new AbortController();
    const current = version.current;
    const timer = setTimeout(async () => {
      try {
        const response = await movieFetch(`/api/tmdb?path=search/movie&query=${encodeURIComponent(query.trim())}&language=${language}`, { signal: controller.signal });
        const data = await response.json();
        if (!Array.isArray(data.results)) throw new Error('movie_service_error');
        if (controller.signal.aborted || current !== version.current) return;
        setResults(data.results);
        setStatus('ready');
      } catch (err) {
        if (controller.signal.aborted || current !== version.current) return;
        setError(err.message);
        setStatus('error');
      }
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, language, retry]);

  function changeQuery(value) {
    version.current += 1;
    setQuery(value);
    setResults([]);
    setError('');
    setNotice('');
    setStatus(value.trim().length >= 2 ? 'loading' : 'idle');
  }

  async function select(movie) {
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      await onSelect(movie);
      changeQuery('');
      if (adding) setNotice(t('movie_added', { title: movie.title }));
    } catch {
      setError('movie_save_error');
    } finally { setSaving(false); }
  }

  return <div className="movie-search">
    <label htmlFor={id}>{label}</label>
    <input id={id} type="search" value={query} disabled={saving}
      onChange={event => changeQuery(event.target.value)} aria-describedby={`${id}-help`}
      autoComplete="off" />
    <small id={`${id}-help`}>{t(adding ? 'add_movie_help' : 'search_movie_help')}</small>
    <p role="status">{saving ? t('saving_movie') : notice || (status === 'loading' ? t('searching_movies') : status === 'ready' && !results.length ? t('no_movie_results') : '')}</p>
    {error && <p role="alert">{t(error)} {status === 'error' && <button type="button" onClick={() => { setError(''); setStatus('loading'); setRetry(value => value + 1); }}>{t('retry')}</button>}</p>}
    {!!results.length && <ul className="movie-search-results" aria-label={label}>
      {results.slice(0, 5).map(movie => <li key={movie.id}><button type="button" disabled={saving} onClick={() => select(movie)}>
        {movie.title}{movie.release_date ? ` (${movie.release_date.slice(0, 4)})` : ''}{adding ? ` — ${t('add_to_list')}` : ''}
      </button></li>)}
    </ul>}
  </div>;
}
