import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/" className="font-display text-2xl font-extrabold text-ink">
          Ami<span className="text-ember">Go</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm font-semibold">
          <NavLink to="/" className="text-slate-700">Shop</NavLink>
          {user && <NavLink to="/orders" className="text-slate-700">Orders</NavLink>}
          {user && <NavLink to="/wishlist" className="text-slate-700">Wishlist</NavLink>}
          {user?.role === "admin" && <NavLink to="/admin" className="text-slate-700">Admin</NavLink>}
          {!user && <NavLink to="/login" className="rounded bg-ink px-3 py-1 text-white">Login</NavLink>}
          {user && (
            <button onClick={logout} className="rounded bg-ember px-3 py-1 text-white">
              Logout
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
