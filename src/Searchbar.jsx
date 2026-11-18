import { movieFetch } from "./services/tmdb";
import "./Searchbar.css";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Searchbar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const navigate = useNavigate();
  const formRef = useRef(null);

  const { t, i18n } = useTranslation();

  const languageMap = {
    en: "en-US",
    es: "es-ES",
    pt: "pt-BR",
  };

  const tmdbLang = languageMap[i18n.language] || "en-US";

  // SEARCH ENGINE
  useEffect(() => {
    if (query.length < 2) {

      return;
    }

    const controller = new AbortController();
    movieFetch(
      `/api/tmdb?path=search/movie&query=${encodeURIComponent(query)}&language=${tmdbLang}`,
      { signal: controller.signal },
    )
      .then((res) => res.json())
      .then((data) => setResults(data.results || []))
      .catch((err) => {
        if (err.name !== "AbortError") console.error(err);
      });

    return () => controller.abort();
  }, [query, tmdbLang]);

  // Click away to close dropdown
  useEffect(() => {
    function handleClick(e) {
      if (formRef.current && !formRef.current.contains(e.target)) {
        setResults([]);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Navigate to movie page on click
  function handleSelect(movieId) {
    setQuery("");
    setResults([]);
    navigate(`/movie/${movieId}`);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (results[0]) handleSelect(results[0].id);
  }

  // SEARCHBAR
  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder={t("search")}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {/* DROPDOWN */}
      {query.length >= 2 && results.length > 0 && (
        <ul>
          {results.slice(0, 5).map((movie) => (
            <li key={movie.id} onClick={() => handleSelect(movie.id)}>
              <img
                src={
                  movie.poster_path
                    ? `https://image.tmdb.org/t/p/w92${movie.poster_path}`
                    : "/poster.png"
                }
                alt={movie.title}
              />
              <span>{movie.title}</span>
              <small>({(movie.release_date || "").slice(0, 4)})</small>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
