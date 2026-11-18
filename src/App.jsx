import { movieFetch } from "./services/tmdb";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useRef, useCallback } from "react";
import { getLists, createList, changeList, currentUser } from "./services/lists";
import "./App.css";
import { readGuest } from "./services/guest";

// STAR RATING COMPONENT
function StarRating({ listId, movieId, rating, onRate }) {
  const [hovered, setHovered] = useState(null);

  const handleRightClick = (e) => {
    e.preventDefault();
    onRate(listId, movieId, 0);
  };

  return (
    <span
      style={{ fontSize: "1.2rem", cursor: "pointer" }}
      onContextMenu={handleRightClick}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(null)}
          onClick={() => onRate(listId, movieId, star)}
          onContextMenu={handleRightClick}
        >
          {star <= (hovered ?? rating) ? "★" : "☆"}
        </span>
      ))}
    </span>
  );
}

export default function App() {
  // LANGUAGE
  const { t, i18n } = useTranslation();

  const languageMap = {
    en: "en-US",
    es: "es-ES",
    pt: "pt-BR",
  };

  const tmdbLang = languageMap[i18n.language] || "en-US";

  const [error, setError] = useState("");
  const [guestMode, setGuestMode] = useState(null);
  const [pendingImport, setPendingImport] = useState(false);
  // STATES
  const [movieLists, setMovieLists] = useState([]);
  const [movieCache, setMovieCache] = useState({});
  const cachedMovies = useRef({});
  const cacheLanguage = useRef(tmdbLang);
  const [showCreateListPopup, setShowCreateListPopup] = useState(false);

  const [newList, setNewList] = useState({
    title: "",
  });

  const [confirmListDelete, setConfirmListDelete] = useState(null);
  const [confirmMovieRemove, setConfirmMovieRemove] = useState(null);

  const [addQueries, setAddQueries] = useState({});
  const [addResults, setAddResults] = useState({});

  const addMovieRefs = useRef({});
  const searchVersions = useRef({});

  // FETCH LISTS
  const fetchLists = useCallback(async () => {
    try {
      const data = await getLists();
      setMovieLists(data);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    getLists().then(setMovieLists).catch(err => setError(err.message));
    currentUser().then(user => {
      setGuestMode(!user);
      setPendingImport(!!user && readGuest().lists.length > 0);
    }).catch(err => setError(err.message));
  }, []);

  // HANDLE INPUT
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewList((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // CREATE LIST
  const handleCreateList = async () => {
    try {
      await createList(newList.title);
      setNewList({ title: "" });
      setShowCreateListPopup(false);

      fetchLists();
    } catch (err) {
      setError(err.message);
    }
  };

  const runChange = async (id, transform) => {
    try { setError(""); await changeList(id, transform); await fetchLists(); }
    catch (err) { setError(err.message); }
  };
  const handleDeleteList = id => runChange(id, () => null);
  const handleAddMovie = async (id, movie) => {
    searchVersions.current[id] = (searchVersions.current[id] || 0) + 1;
    await runChange(id, list => ({ ...list, movies: list.movies.some(m => m.movieId === movie.id) ? list.movies : [...list.movies, { movieId: movie.id, rating: 0 }] }));
    setAddResults(prev => ({ ...prev, [id]: [] }));
    setAddQueries(prev => ({ ...prev, [id]: "" }));
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      Object.entries(addMovieRefs.current).forEach(([listId, el]) => {
        if (el && !el.contains(e.target)) {
          setAddResults((prev) => ({
            ...prev,
            [listId]: [],
          }));
        }
      });
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRemoveMovie = (id, movieId) => runChange(id, list => ({ ...list, movies: list.movies.filter(m => m.movieId !== movieId) }));
  // SEARCH MOVIES
  const searchMovies = async (listId, query) => {
    const version = (searchVersions.current[listId] || 0) + 1;
    searchVersions.current[listId] = version;
    if (query.length < 2) {
      setAddResults((prev) => ({ ...prev, [listId]: [] }));
      return;
    }

    const res = await movieFetch(
      `/api/tmdb?path=search/movie&query=${encodeURIComponent(
        query,
      )}&language=${tmdbLang}`,
    );

    const data = await res.json();
    if (searchVersions.current[listId] !== version) return;

    setAddResults((prev) => ({
      ...prev,
      [listId]: data.results || [],
    }));
  };

  // HANDLE ADD QUERY
  const handleAddQueryChange = (listId, value) => {
    setAddQueries((prev) => ({
      ...prev,
      [listId]: value,
    }));

    searchMovies(listId, value).catch(err => setError(err.message));
  };

  const handleUpdateRating = (id, movieId, rating) => runChange(id, list => ({ ...list, movies: list.movies.map(m => m.movieId === movieId ? { ...m, rating } : m) }));
  // FETCH TMDB MOVIES
  useEffect(() => {
    if (cacheLanguage.current !== tmdbLang) { cachedMovies.current = {}; cacheLanguage.current = tmdbLang; }
    let active = true;
    const allIds = [
      ...new Set(
        movieLists.flatMap((list) => (list.movies || []).map((m) => m.movieId)),
      ),
    ];

    allIds.forEach((id) => {
      if (cachedMovies.current[id]) return;
      cachedMovies.current[id] = true;

      movieFetch(
        `/api/tmdb?path=movie/${id}&language=${tmdbLang}`,
      )
        .then((res) => res.json())
        .then((data) => {
          if (!active) { delete cachedMovies.current[id]; return; }
          setMovieCache((prev) => ({
            ...prev,
            [id]: data.title || "Unknown title",
          }));
        })
        .catch(() => {
          setMovieCache((prev) => ({
            ...prev,
            [id]: "Unknown title",
          }));
        });
    });
    return () => { active = false; cachedMovies.current = {}; };
  }, [movieLists, tmdbLang]);

  // UI
  return (
    <main>
      {error && <p role="alert">{error}</p>}
      {guestMode && <p>You are a guest. Lists are saved in this browser. <a href="/login">Sign in</a> to keep them in your account.</p>}
      {pendingImport && <p>Some guest lists still need importing. <a href="/login">Retry import</a>.</p>}
      <div>
        <h2>{t("your_lists")}</h2>
        <button onClick={() => setShowCreateListPopup(true)}>
          {t("create_new_list")}
        </button>
        {showCreateListPopup && (
          <div
            className="overlay"
            onClick={() => setShowCreateListPopup(false)}
          >
            <div className="popup" onClick={(e) => e.stopPropagation()}>
              <h2>{t("create_new_list_header")}</h2>

              <input
                type="text"
                name="title"
                placeholder={t("list_title")}
                value={newList.title}
                onChange={handleChange}
              />

              <div>
                <button onClick={handleCreateList}>{t("create")}</button>

                <button onClick={() => setShowCreateListPopup(false)}>
                  {t("close")}
                </button>
              </div>
            </div>
          </div>
        )}
        {confirmListDelete && (
          <div className="overlay" onClick={() => setConfirmListDelete(null)}>
            <div className="popup" onClick={(e) => e.stopPropagation()}>
              <p>{t("delete_list_confirm")}</p>
              <div>
                <button
                  onClick={() => {
                    handleDeleteList(confirmListDelete);
                    setConfirmListDelete(null);
                  }}
                >
                  {t("delete")}
                </button>
                <button onClick={() => setConfirmListDelete(null)}>
                  {t("cancel")}
                </button>
              </div>
            </div>
          </div>
        )}
        {confirmMovieRemove && (
          <div className="overlay" onClick={() => setConfirmMovieRemove(null)}>
            <div className="popup" onClick={(e) => e.stopPropagation()}>
              <p>{t("remove_movie_confirm")}</p>
              <div>
                <button
                  onClick={() => {
                    handleRemoveMovie(
                      confirmMovieRemove.listId,
                      confirmMovieRemove.movieId,
                    );
                    setConfirmMovieRemove(null);
                  }}
                >
                  {t("remove")}
                </button>
                <button onClick={() => setConfirmMovieRemove(null)}>
                  {t("cancel")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <section>
        {movieLists.length === 0 ? (
          <p>{t("no_lists_yet")}</p>
        ) : (
          movieLists.map((list) => (
            <div key={list.id}>
              <article>
                <div>
                  <h3>{list.title}</h3>
                  <button onClick={() => setConfirmListDelete(list.id)}>
                    🗑️
                  </button>
                </div>

                {(list.movies || []).map((movie) => (
                  <li
                    key={movie.movieId}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span
                      style={{ cursor: "pointer" }}
                      onClick={() =>
                        (window.location.href = `/movie/${movie.movieId}`)
                      }
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setConfirmMovieRemove({
                          listId: list.id,
                          movieId: movie.movieId,
                        });
                      }}
                    >
                      {movieCache[movie.movieId] || "..."}
                    </span>
                    <StarRating
                      listId={list.id}
                      movieId={movie.movieId}
                      rating={movie.rating}
                      onRate={handleUpdateRating}
                    />
                  </li>
                ))}

                <div
                  className="add-movie-container"
                  ref={(el) => (addMovieRefs.current[list.id] = el)}
                >
                  <input
                    type="text"
                    placeholder={t("add_movie")}
                    value={addQueries[list.id] || ""}
                    onChange={(e) =>
                      handleAddQueryChange(list.id, e.target.value)
                    }
                  />

                  {addResults[list.id]?.length > 0 && (
                    <ul className="dropdown">
                      {addResults[list.id].slice(0, 5).map((movie) => (
                        <li
                          key={movie.id}
                          onClick={() => handleAddMovie(list.id, movie)}
                        >
                          {movie.title}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </article>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
