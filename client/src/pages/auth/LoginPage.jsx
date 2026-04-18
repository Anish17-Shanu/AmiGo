import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const LoginPage = () => {
  const [email, setEmail] = useState("user@amigo.com");
  const [password, setPassword] = useState("User@123");
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    await login({ email, password });
    navigate("/");
  };

  return (
    <div className="mx-auto mt-20 max-w-md rounded-2xl bg-white p-6 shadow-xl">
      <h1 className="font-display text-3xl font-bold">Login</h1>
      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded border p-2" placeholder="Email" />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded border p-2" placeholder="Password" />
        <button className="w-full rounded bg-ink p-2 font-semibold text-white">Sign In</button>
      </form>
      <p className="mt-3 text-sm">Need account? <Link className="text-tide" to="/register">Register</Link></p>
    </div>
  );
};

export default LoginPage;
