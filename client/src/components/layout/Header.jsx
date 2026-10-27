import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useToast } from "../../context/ToastContext";

const navClass = ({ isActive }) =>
  `transition hover:text-tide ${isActive ? "text-ink" : "text-slate-700"}`;

const CartIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l2.4 12.2a1 1 0 001 .8h9.2a1 1 0 001-.8L21 7H6" />
    <circle cx="9" cy="20" r="1.4" />
    <circle cx="18" cy="20" r="1.4" />
  </svg>
);

const Header = () => {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast("Signed out", "success");
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex flex-col">
          <Link to="/" className="font-display text-2xl font-extrabold text-ink">
            Ami<span className="text-ember">Go</span>
          </Link>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Created by Anish Kumar
          </span>
        </div>

        <nav className="flex flex-wrap items-center justify-end gap-3 text-sm font-semibold sm:gap-4">
          <NavLink to="/" end className={navClass}>
            Shop
          </NavLink>
          {user && (
            <NavLink to="/orders" className={navClass}>
              Orders
            </NavLink>
          )}
          {user && (
            <NavLink to="/wishlist" className={navClass}>
              Wishlist
            </NavLink>
          )}
          {user?.role === "admin" && (
            <NavLink to="/admin" className={navClass}>
              Admin
            </NavLink>
          )}

          {user ? (
            <>
              <NavLink
                to="/cart"
                aria-label={`Cart with ${count} item${count === 1 ? "" : "s"}`}
                className="relative inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-slate-700 transition hover:text-tide"
              >
                <CartIcon />
                <span className="hidden sm:inline">Cart</span>
                {count > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-ember px-1 text-[10px] font-bold text-white">
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </NavLink>
              <span className="hidden max-w-[9rem] truncate text-xs font-normal text-slate-500 md:inline">
                {user.name}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg bg-ember px-3 py-1.5 text-white transition hover:bg-orange-600"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="rounded-lg bg-ink px-3 py-1.5 text-white transition hover:bg-slate-800">
                Login
              </NavLink>
              <NavLink to="/register" className="text-slate-700 transition hover:text-tide">
                Register
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
