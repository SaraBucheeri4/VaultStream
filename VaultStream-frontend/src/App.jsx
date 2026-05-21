import React, { useState } from "react";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { GradientDefs } from "./components/Icon.jsx";
import { TopNav, Sidebar } from "./components/Shell.jsx";
import Login from "./components/Login.jsx";
import LogsView from "./components/LogsView.jsx";
import MetricsView from "./components/MetricsView.jsx";
import Silk from "./components/Silk.jsx";

const SCREEN_LABELS = {
  "/logs": "Logs View",
  "/analytics": "Metrics View",
};

function Layout({ user, onSignOut }) {
  const { pathname } = useLocation();
  const label = SCREEN_LABELS[pathname] || "View";
  return (
    <div className="app">
      <TopNav user={user} onSignOut={onSignOut} />
      <Sidebar onSignOut={onSignOut} />
      <main className="main scroll-hide" data-screen-label={label}>
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  // Auth state — persists across refresh so prototype reviewers can keep state.
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("fos_user") || "null");
    } catch (e) {
      return null;
    }
  });

  const handleAuth = (u) => {
    setUser(u);
    try {
      localStorage.setItem("fos_user", JSON.stringify(u));
    } catch (e) {}
  };
  const handleSignOut = () => {
    setUser(null);
    sessionStorage.removeItem("fos_token");
    try {
      localStorage.removeItem("fos_user");
    } catch (e) {}
  };

  if (!user)
    return (
      <>
        <GradientDefs />
        <Login onAuth={handleAuth} />
      </>
    );

  return (
    <>
      <GradientDefs />
      <div className="silk-bg">
        <Silk speed={10} scale={1} color="#022e37" noiseIntensity={1.5} rotation={0} />
      </div>
      <Routes>
        <Route element={<Layout user={user} onSignOut={handleSignOut} />}>
          <Route index element={<Navigate to="/logs" replace />} />
          <Route path="/logs" element={<LogsView />} />
          <Route path="/analytics" element={<MetricsView />} />
          <Route path="*" element={<Navigate to="/logs" replace />} />
        </Route>
      </Routes>
    </>
  );
}
