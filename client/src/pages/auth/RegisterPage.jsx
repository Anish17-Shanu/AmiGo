import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { apiErrorMessage } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

const RegisterPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { register } = useAuth();
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
      await register({ name, email, password });
      toast("Account created", "success");
      navigate(from, { replace: true });
    } catch (requestError) {
      setError(apiErrorMessage(requestError, "Registration failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto mt-16 max-w-md px-4">
      <div className="rounded-2xl bg-white p-6 shadow-xl">
        <h1 className="font-display text-3xl font-bold">Create account</h1>
        <p className="mt-1 text-sm text-slate-500">Start shopping with a personal cart and order history.</p>

        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="register-name" className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Name
            </label>
            <input
              id="register-name"
              required
              minLength={2}
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="input"
            />
          </div>

          <div>
            <label htmlFor="register-email" className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Email
            </label>
            <input
              id="register-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="input"
            />
          </div>

          <div>
            <label htmlFor="register-password" className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Password
            </label>
            <input
              id="register-password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="input"
            />
            <p className="mt-1 text-xs text-slate-500">Use at least 8 characters.</p>
          </div>

          {error && (
            <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
              {error}
            </p>
          )}

          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-600">
          Already have an account?{" "}
          <Link className="font-semibold text-tide" to="/login" state={{ from }}>
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
