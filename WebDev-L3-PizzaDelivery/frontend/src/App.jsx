import { createContext, useContext, useState } from "react";
import { Routes, Route, Navigate, Link } from "react-router-dom";
import { Register, Login, Verify, Forgot, Reset } from "./pages/UserPages.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import { AdminLogin, AdminPanel } from "./pages/Admin.jsx";

const AuthCtx = createContext();
export const useAuth = () => useContext(AuthCtx);

const stored = () => { try { return JSON.parse(localStorage.getItem("pizza_session")); } catch { return null; } };

function Guard({ role, children }) {
  const { session } = useAuth();
  if (!session || session.role !== role) return <Navigate to={role === "admin" ? "/admin/login" : "/login"} replace />;
  return children;
}

export default function App() {
  const [session, setSession] = useState(stored());
  const login = (s) => { localStorage.setItem("pizza_session", JSON.stringify(s)); setSession(s); };
  const logout = () => { localStorage.removeItem("pizza_session"); setSession(null); };

  return (
    <AuthCtx.Provider value={{ session, login, logout }}>
      <header className="top">
        <Link to="/" className="brand">Pizza Delivery</Link>
        {session && (
          <span>
            {session.name} ({session.role}) <button className="ghost" onClick={logout}>Logout</button>
          </span>
        )}
      </header>
      <main className="page">
        <Routes>
          <Route path="/" element={<Guard role="user"><Dashboard /></Guard>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify/:token" element={<Verify />} />
          <Route path="/forgot" element={<Forgot />} />
          <Route path="/reset/:token" element={<Reset />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<Guard role="admin"><AdminPanel /></Guard>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </AuthCtx.Provider>
  );
}
