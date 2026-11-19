import { currentUser, logout } from "./services/lists";
import "./Navbar.css";
import Searchbar from "./Searchbar";
import i18n from "i18next";
import { useTranslation } from "react-i18next";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef(null);
  const [themeOpen, setThemeOpen] = useState(false);
  const themeRef = useRef(null);
  const [mode, setMode] = useState(() => localStorage.getItem("mode") || "dark");
  const [color, setColor] = useState(() => localStorage.getItem("color") || "default");
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    currentUser().then(setUser).catch(() => setUser(null));
  }, [location]);

  useEffect(() => {
    const handleStorageChange = () => {
      currentUser().then(setUser).catch(() => setUser(null));
    };

    window.addEventListener("storage", handleStorageChange);

    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme) {
      document.documentElement.className = savedTheme;
    }


    // Click away to close dropdown
    function handleClick(e) {
      if (langRef.current && !langRef.current.contains(e.target)) {
        setLangOpen(false);
      }
      if (themeRef.current && !themeRef.current.contains(e.target)) {
        setThemeOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);

    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, []);

  function updateTheme(newMode, newColor) {
    const html = document.documentElement;
    const theme = `${newMode}-${newColor}`;

    html.className = theme;

    localStorage.setItem("theme", theme);
    localStorage.setItem("mode", newMode);
    localStorage.setItem("color", newColor);
  }

  async function handleLogout() {
    try { await logout(); setUser(null); navigate("/"); }
    catch (error) { alert(error.message); }
  }

  return (
    <nav>
      {/* LOGO */}
      <header>
        <button onClick={() => navigate("/")}>
          <img src="/movie.ico" height="48" />
          <h1>Movielist</h1>
        </button>
      </header>

      {/* SEARCHBAR */}
      <Searchbar />

      {/* MENU */}
      <div>
        <button onClick={() => navigate("/")}>
          <img src="/home.png" height="24" alt="" />
          {t("home")}
        </button>

        {/* LOGIN/LOGOUT/USER */}
        {!user ? (
          <button onClick={() => navigate("/login")}>
            <img src="/login.png" height="24" />
            {t("login")}
          </button>
        ) : (
          <>
            <button onClick={handleLogout}>
              <img src="/logout.png" height="24" />
              {t("logout")}
            </button>

            <button onClick={() => navigate("/usersettings")}>
              <img src="/user.png" height="24" />
              {t("user")}
            </button>
          </>
        )}

        {/* COMMUNITY */}
        <button onClick={() => navigate("/community")}>
          <img src="/msn.ico" height="24" />
          {t("community")}
        </button>

        {/* LANGUAGE */}
        <section ref={langRef}>
          <button onClick={() => setLangOpen(!langOpen)}>
            <img src="/globe.ico" height="24" />
            {t("language")}
          </button>

          {langOpen && (
            <menu>
              <select
                value={i18n.language}
                onChange={(e) => {
                  const lang = e.target.value;
                  i18n.changeLanguage(lang);
                  localStorage.setItem("language", lang);
                }}
              >
                <option value="en">🇺🇸 English</option>
                <option value="es">🇪🇸 Español</option>
                <option value="pt">🇧🇷 Português</option>
              </select>
            </menu>
          )}
        </section>

        {/* THEME */}
        <section ref={themeRef}>
          <button onClick={() => setThemeOpen(!themeOpen)}>
            <img src="/theme.ico" height="24" />
            {t("theme")}
          </button>

          {themeOpen && (
            <menu>
              <li>
                <h3>Mode: </h3>
                <select
                  value={mode}
                  onChange={(e) => {
                    const newMode = e.target.value;
                    setMode(newMode);
                    updateTheme(newMode, color);
                  }}
                >
                  <option value="dark">{t("dark")}</option>
                  <option value="light">{t("light")}</option>
                </select>
              </li>
              <li>
                <h3>Color: </h3>
                <select
                  value={color}
                  onChange={(e) => {
                    const newColor = e.target.value;
                    setColor(newColor);
                    updateTheme(mode, newColor);
                  }}
                >
                  <option value="default">{t("default")}</option>
                  <option value="blue">{t("blue")}</option>
                  <option value="green">{t("green")}</option>
                  <option value="red">{t("red")}</option>
                  <option value="pink">{t("pink")}</option>
                </select>
              </li>
            </menu>
          )}
        </section>
      </div>
    </nav>
  );
}
