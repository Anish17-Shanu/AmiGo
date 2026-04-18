import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const RegisterPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { register } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    await register({ name, email, password });
    navigate("/");
  };

  return (
    <div className="mx-auto mt-20 max-w-md rounded-2xl bg-white p-6 shadow-xl">
      <h1 className="font-display text-3xl font-bold">Create Account</h1>
      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded border p-2" placeholder="Name" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded border p-2" placeholder="Email" />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded border p-2" placeholder="Password" />
        <button className="w-full rounded bg-ink p-2 font-semibold text-white">Register</button>
      </form>
      <p className="mt-3 text-sm">Already have account? <Link className="text-tide" to="/login">Login</Link></p>
    </div>
  );
};

export default RegisterPage;
