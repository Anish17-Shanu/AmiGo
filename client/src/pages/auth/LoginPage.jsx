import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { apiErrorMessage } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

const DEMO_ACCOUNTS = [
  {
    role: "Customer",
    title: "Demo Customer",
    email: "user@amigo.com",
    password: "User@123",
    description: "Browse products, manage cart & wishlist, place test orders",
    badgeColor: "bg-sky-100 text-sky-800 border-sky-200"
  },
  {
    role: "Admin",
    title: "Demo Admin",
    email: "admin@amigo.com",
    password: "Admin@123",
    description: "Revenue charts, live order stream, inventory CRUD, ML insights",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-200"
  }
];

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

  const performLogin = async (loginEmail, loginPassword) => {
    setBusy(true);
    setError("");
    try {
      await login({ email: loginEmail, password: loginPassword });
      toast("Welcome back", "success");
      navigate(from, { replace: true });
    } catch (requestError) {
      setError(apiErrorMessage(requestError, "Login failed"));
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    await performLogin(email, password);
  };

  const handleSelectDemo = (account) => {
    setEmail(account.email);
    setPassword(account.password);
    setError("");
  };

  const handleInstantDemoLogin = async (account) => {
    setEmail(account.email);
    setPassword(account.password);
    await performLogin(account.email, account.password);
  };

  return (
    <div className="mx-auto mt-10 max-w-lg px-4 pb-12">
      <div className="rounded-2xl bg-white p-6 shadow-xl sm:p-8">
        <h1 className="font-display text-3xl font-bold text-slate-900">Sign In</h1>
        <p className="mt-1 text-sm text-slate-500">
          Sign in to your AmiGo account or pick a demo role below.
        </p>

        {/* Demo Credentials Box */}
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              ⚡ Demo Accounts
            </span>
            <span className="text-[11px] text-slate-500">Click to fill or sign in</span>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {DEMO_ACCOUNTS.map((account) => {
              const isSelected = email === account.email;
              return (
                <div
                  key={account.role}
                  className={`flex flex-col justify-between rounded-xl border p-3.5 transition ${
                    isSelected
                      ? "border-tide bg-sky-50/50 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-sm font-bold text-slate-900">{account.title}</span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${account.badgeColor}`}
                      >
                        {account.role}
                      </span>
                    </div>

                    <div className="mt-2 space-y-0.5 font-mono text-[11px] text-slate-600">
                      <div>
                        <span className="text-slate-400">email:</span> {account.email}
                      </div>
                      <div>
                        <span className="text-slate-400">pass:</span> {account.password}
                      </div>
                    </div>

                    <p className="mt-2 text-[11px] text-slate-500 leading-relaxed">
                      {account.description}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center gap-1.5 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleSelectDemo(account)}
                      className="flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Auto-fill
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleInstantDemoLogin(account)}
                      className="flex-1 rounded-lg bg-slate-900 px-2 py-1 text-[11px] font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                    >
                      {busy && email === account.email ? "Signing in..." : "Instant Login"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="login-email"
              className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500"
            >
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
            <label
              htmlFor="login-password"
              className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500"
            >
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
            <p
              role="alert"
              className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700"
            >
              {error}
            </p>
          )}

          <button type="submit" disabled={busy} className="btn-primary w-full py-2.5">
            {busy ? "Signing in..." : "Sign in with Credentials"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
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
