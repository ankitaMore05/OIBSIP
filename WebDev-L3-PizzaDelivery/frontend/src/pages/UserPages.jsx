import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../App.jsx";

// Reusable form: fields, submit label, async onSubmit that may return a success message
export function AuthForm({ title, fields, submit, onSubmit, children }) {
  const [vals, setVals] = useState({});
  const [msg, setMsg] = useState({ text: "", ok: false });
  const [busy, setBusy] = useState(false);

  async function go(e) {
    e.preventDefault();
    setBusy(true); setMsg({ text: "", ok: false });
    try {
      const m = await onSubmit(vals);
      if (m) setMsg({ text: m, ok: true });
    } catch (err) {
      setMsg({ text: err.message, ok: false });
    } finally { setBusy(false); }
  }

  return (
    <form className="card narrow" onSubmit={go}>
      <h1>{title}</h1>
      {fields.map((f) => (
        <label key={f.name}>{f.label}
          <input type={f.type || "text"} value={vals[f.name] || ""} required
            onChange={(e) => setVals({ ...vals, [f.name]: e.target.value })} />
        </label>
      ))}
      <button disabled={busy}>{busy ? "Please wait..." : submit}</button>
      {msg.text && <p className={msg.ok ? "ok" : "err"} role="alert">{msg.text}</p>}
      {children}
    </form>
  );
}

export function Register() {
  return (
    <AuthForm title="Create account" submit="Register"
      fields={[{ name: "name", label: "Name" }, { name: "email", label: "Email", type: "email" },
               { name: "password", label: "Password (8+ characters, with a number)", type: "password" }]}
      onSubmit={(v) => api("/auth/register", { method: "POST", body: v }).then((r) => r.message)}>
      <p className="alt">Already registered? <Link to="/login">Login</Link></p>
    </AuthForm>
  );
}

export function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  return (
    <AuthForm title="Login" submit="Login"
      fields={[{ name: "email", label: "Email", type: "email" }, { name: "password", label: "Password", type: "password" }]}
      onSubmit={async (v) => { login(await api("/auth/login", { method: "POST", body: v })); nav("/"); }}>
      <p className="alt"><Link to="/forgot">Forgot password?</Link> | <Link to="/register">Create account</Link></p>
    </AuthForm>
  );
}

export function Verify() {
  const { token } = useParams();
  const [msg, setMsg] = useState({ text: "Verifying...", ok: true });
  useEffect(() => {
    api("/auth/verify", { method: "POST", body: { token } })
      .then((r) => setMsg({ text: r.message, ok: true }))
      .catch((e) => setMsg({ text: e.message, ok: false }));
  }, [token]);
  return (
    <div className="card narrow">
      <h1>Email verification</h1>
      <p className={msg.ok ? "ok" : "err"}>{msg.text}</p>
      <Link to="/login">Go to login</Link>
    </div>
  );
}

export function Forgot() {
  return (
    <AuthForm title="Forgot password" submit="Send reset link"
      fields={[{ name: "email", label: "Email", type: "email" }]}
      onSubmit={(v) => api("/auth/forgot", { method: "POST", body: v }).then((r) => r.message)}>
      <p className="alt"><Link to="/login">Back to login</Link></p>
    </AuthForm>
  );
}

export function Reset() {
  const { token } = useParams();
  return (
    <AuthForm title="Choose a new password" submit="Update password"
      fields={[{ name: "password", label: "New password (8+ characters, with a number)", type: "password" }]}
      onSubmit={(v) => api("/auth/reset", { method: "POST", body: { token, password: v.password } }).then((r) => r.message)}>
      <p className="alt"><Link to="/login">Go to login</Link></p>
    </AuthForm>
  );
}
