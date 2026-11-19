import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import "./themes.css";
import "./i18n";
import App from "./App.jsx";
import Community from "./Community.jsx";
import Login from "./Login.jsx";
import Signup from "./Signup.jsx";
import Movie from "./Movie.jsx";
import Navbar from "./Navbar.jsx";
import UserProfile from "./UserProfile.jsx";
import UserSettings from "./UserSettings.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/community" element={<Community />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/movie/:id" element={<Movie />} />
        <Route path="/:user" element={<UserProfile />} />
        <Route path="/usersettings" element={<UserSettings />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
