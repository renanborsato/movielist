import { movieFetch } from "./services/tmdb";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./Movie.css";

export default function Movie() {
  const { id } = useParams();
  const [error, setError] = useState("");
  const [movie, setMovie] = useState(null);
  const { t, i18n } = useTranslation();

  const languageMap = {
    en: "en-US",
    es: "es-ES",
    pt: "pt-BR",
  };

  const tmdbLang = languageMap[i18n.language] || "en-US";

  useEffect(() => {
    async function fetchMovie() {
      try {
        const res = await movieFetch(
          `/api/tmdb?path=movie/${id}&language=${tmdbLang}`,
        );
        const data = await res.json();
        setMovie(data);
      } catch (err) {
        setError(err.message);
      }
    }

    fetchMovie();
  }, [id, tmdbLang]);

  if (error) return <main><p role="alert">{error}</p></main>;
  if (!movie) return <p>Loading...</p>;

  return (
    <main>
      <div className="movie-container">
        <img
          src={
            movie.poster_path
              ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
              : "/poster.png"
          }
          alt={movie.title || movie.original_title}
        />

        <div className="movie-details">
          <h1>{movie.title}</h1>

          {movie.original_title !== movie.title && (
            <p>
              <strong>{t("original_title")}:</strong> {movie.original_title}
            </p>
          )}

          <p>
            <strong>{t("release_date")}:</strong>{" "}
            {movie.release_date || "Unknown"}
          </p>

          <p>{movie.overview || t("no_description")}</p>
        </div>
      </div>
    </main>
  );
}
