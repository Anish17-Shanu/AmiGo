import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { apiErrorMessage } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

const LoginPage = () => {
  const [email, setEmail] = useState("user@amigo.com");
  const [password, setPassword] = useState("User@123");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from =
    typeof location.state?.from === "string" && location.state.from.startsWith("/")
      ? location.state.from
      : "/";

  const onSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login({ email, password });
      toast("Welcome back", "success");
      navigate(from, { replace: true });
    } catch (requestError) {
      setError(apiErrorMessage(requestError, "Login failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto mt-16 max-w-md px-4">
      <div className="rounded-2xl bg-white p-6 shadow-xl">
        <h1 className="font-display text-3xl font-bold">Login</h1>
        <p className="mt-1 text-sm text-slate-500">Sign in to manage your cart, wishlist, and orders.</p>

        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="login-email" className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="input"
            />
          </div>

          <div>
            <label htmlFor="login-password" className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="input"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
              {error}
            </p>
          )}

          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <button
            type="button"
            className="btn-secondary px-3 py-1.5"
            onClick={() => {
              setEmail("user@amigo.com");
              setPassword("User@123");
            }}
          >
            Use demo user
          </button>
          <button
            type="button"
            className="btn-secondary px-3 py-1.5"
            onClick={() => {
              setEmail("admin@amigo.com");
              setPassword("Admin@123");
            }}
          >
            Use demo admin
          </button>
        </div>

        <p className="mt-4 text-sm text-slate-600">
          Need an account?{" "}
          <Link className="font-semibold text-tide" to="/register" state={{ from }}>
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
