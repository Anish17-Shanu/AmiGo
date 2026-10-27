import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api, { apiErrorMessage } from "../../api/client";
import ProductCard from "../../components/products/ProductCard";
import Container from "../../components/layout/Container";
import EmptyState from "../../components/EmptyState";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useToast } from "../../context/ToastContext";

const EMPTY_FILTERS = { q: "", category: "", minPrice: "", maxPrice: "" };
const PAGE_SIZE = 12;

const StorePage = () => {
  const { user } = useAuth();
  const { addItem } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/products", {
        params: { ...filters, page, limit: PAGE_SIZE }
      });
      setProducts(data.items || []);
      setTotal(data.total || 0);
    } catch (requestError) {
      setError(apiErrorMessage(requestError, "Unable to load products"));
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    let active = true;
    api
      .get("/products/categories")
      .then(({ data }) => {
        if (active) setCategories(data.categories || []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setRecommendations([]);
      return undefined;
    }

    let active = true;
    api
      .get("/analytics/recommendations")
      .then(({ data }) => {
        if (active) setRecommendations((data.recommendations || []).slice(0, 4));
      })
      .catch(() => {
        if (active) setRecommendations([]);
      });

    return () => {
      active = false;
    };
  }, [user]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = useMemo(() => Object.values(filters).some(Boolean), [filters]);
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  const applyFilters = (event) => {
    event.preventDefault();
    setPage(1);
    setFilters({ ...draft });
  };

  const resetFilters = () => {
    setDraft(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
    setPage(1);
  };

  const requireUser = () => {
    if (user) return true;
    toast("Please sign in to continue", "info");
    navigate("/login", { state: { from: location.pathname } });
    return false;
  };

  const onAddCart = async (productId) => {
    if (!requireUser()) return;
    try {
      await addItem(productId, 1);
      toast("Added to cart", "success");
    } catch (requestError) {
      toast(apiErrorMessage(requestError, "Could not add to cart"), "error");
    }
  };

  const onAddWishlist = async (productId) => {
    if (!requireUser()) return;
    try {
      await api.post("/wishlist", { productId });
      toast("Saved to wishlist", "success");
    } catch (requestError) {
      toast(apiErrorMessage(requestError, "Could not save item"), "error");
    }
  };

  const renderProducts = () => {
    if (loading) {
      return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-80 animate-pulse rounded-2xl bg-slate-200/70" />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <EmptyState
          title="Could not load products"
          description={error}
          action={
            <button type="button" onClick={fetchProducts} className="btn-primary">
              Retry
            </button>
          }
        />
      );
    }

    if (!products.length) {
      return (
        <EmptyState
          title="No products found"
          description="Try a different search term or clear the filters."
          action={
            hasFilters ? (
              <button type="button" onClick={resetFilters} className="btn-secondary">
                Clear filters
              </button>
            ) : null
          }
        />
      );
    }

    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard
            key={product._id}
            product={product}
            onAddCart={onAddCart}
            onAddWishlist={onAddWishlist}
          />
        ))}
      </div>
    );
  };

  return (
    <Container>
      <section className="mb-6 rounded-3xl bg-hero p-6 text-white sm:p-8">
        <h1 className="font-display text-3xl font-extrabold">AmiGo Smart Store</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-200">
          Data-ranked discovery, AI recommendations, and real-time commerce intelligence in one
          seamless marketplace.
        </p>
      </section>

      <form onSubmit={applyFilters} className="card-glass mb-6 grid gap-3 rounded-2xl p-4 md:grid-cols-6">
        <div className="md:col-span-2">
          <label htmlFor="product-search" className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
            Search
          </label>
          <input
            id="product-search"
            value={draft.q}
            onChange={(event) => setDraft((current) => ({ ...current, q: event.target.value }))}
            placeholder="Search products"
            className="input"
          />
        </div>

        <div>
          <label htmlFor="product-category" className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
            Category
          </label>
          <select
            id="product-category"
            value={draft.category}
            onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))}
            className="input"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="product-min" className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
            Min price
          </label>
          <input
            id="product-min"
            type="number"
            min="0"
            step="0.01"
            value={draft.minPrice}
            onChange={(event) => setDraft((current) => ({ ...current, minPrice: event.target.value }))}
            className="input"
          />
        </div>

        <div>
          <label htmlFor="product-max" className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
            Max price
          </label>
          <input
            id="product-max"
            type="number"
            min="0"
            step="0.01"
            value={draft.maxPrice}
            onChange={(event) => setDraft((current) => ({ ...current, maxPrice: event.target.value }))}
            className="input"
          />
        </div>

        <div className="flex items-end gap-2">
          <button type="submit" className="btn-primary flex-1">
            Apply
          </button>
          <button type="button" onClick={resetFilters} className="btn-secondary">
            Reset
          </button>
        </div>
      </form>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-xl font-bold">Products</h2>
        {!loading && !error && (
          <p className="text-xs text-slate-500">
            Showing {rangeStart}-{rangeEnd} of {total}
          </p>
        )}
      </div>

      {renderProducts()}

      {!loading && !error && totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1}
            className="btn-secondary"
          >
            Previous
          </button>
          <span className="text-sm font-semibold text-slate-600">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={page >= totalPages}
            className="btn-secondary"
          >
            Next
          </button>
        </div>
      )}

      {!!recommendations.length && (
        <section className="mt-10">
          <h2 className="mb-3 font-display text-xl font-bold">Recommended for you</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {recommendations.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onAddCart={onAddCart}
                onAddWishlist={onAddWishlist}
              />
            ))}
          </div>
        </section>
      )}
    </Container>
  );
};

export default StorePage;
