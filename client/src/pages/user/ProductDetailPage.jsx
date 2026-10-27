import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import api, { apiErrorMessage } from "../../api/client";
import Container from "../../components/layout/Container";
import EmptyState from "../../components/EmptyState";
import PageLoader from "../../components/PageLoader";
import ProductCard from "../../components/products/ProductCard";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useToast } from "../../context/ToastContext";
import { currency } from "../../utils/format";

const ProductDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { addItem } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [data, setData] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    api
      .get(`/products/${id}`)
      .then(({ data: response }) => {
        if (active) {
          setData(response);
          setQuantity(1);
        }
      })
      .catch((requestError) => {
        if (active) setError(apiErrorMessage(requestError, "Product not found"));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const requireUser = () => {
    if (user) return true;
    toast("Please sign in to continue", "info");
    navigate("/login", { state: { from: location.pathname } });
    return false;
  };

  const handleAddCart = async (productId, amount = 1) => {
    if (!requireUser()) return;
    try {
      await addItem(productId, amount);
      toast("Added to cart", "success");
    } catch (requestError) {
      toast(apiErrorMessage(requestError, "Could not add to cart"), "error");
    }
  };

  const handleAddWishlist = async (productId) => {
    if (!requireUser()) return;
    try {
      await api.post("/wishlist", { productId });
      toast("Saved to wishlist", "success");
    } catch (requestError) {
      toast(apiErrorMessage(requestError, "Could not save item"), "error");
    }
  };

  if (loading) return <PageLoader label="Loading product..." />;

  if (error || !data?.product) {
    return (
      <Container>
        <EmptyState
          title="Product unavailable"
          description={error || "This product could not be found."}
          action={
            <Link to="/" className="btn-primary">
              Back to shop
            </Link>
          }
        />
      </Container>
    );
  }

  const { product, peopleAlsoBought = [] } = data;
  const outOfStock = product.inventory < 1;

  return (
    <Container>
      <Link to="/" className="mb-4 inline-flex text-sm font-semibold text-tide hover:underline">
        &larr; Back to shop
      </Link>

      <div className="grid gap-6 lg:grid-cols-2">
        <img
          src={product.imageUrl}
          alt={product.title}
          className="h-96 w-full rounded-3xl object-cover shadow-xl"
        />

        <div className="card-glass rounded-3xl p-6">
          <p className="text-xs font-bold uppercase tracking-wide text-tide">{product.category}</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold text-ink">{product.title}</h1>
          <p className="mt-2 text-sm font-semibold text-amber-600">&#9733; {product.rating} / 5</p>
          <p className="mt-4 text-sm leading-6 text-slate-600">{product.description}</p>

          <div className="mt-5 flex flex-wrap items-center gap-4">
            <span className="font-display text-3xl font-extrabold text-ink">{currency(product.price)}</span>
            <span className={`text-sm font-semibold ${outOfStock ? "text-rose-600" : "text-emerald-600"}`}>
              {outOfStock ? "Out of stock" : `${product.inventory} in stock`}
            </span>
          </div>

          {!!product.tags?.length && (
            <div className="mt-4 flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor="quantity" className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Quantity
              </label>
              <div className="flex items-center rounded-xl border border-slate-300">
                <button
                  type="button"
                  className="px-3 py-2 text-lg font-bold text-slate-600 disabled:opacity-40"
                  onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <input
                  id="quantity"
                  type="number"
                  min="1"
                  max={Math.max(1, product.inventory)}
                  value={quantity}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    if (!Number.isFinite(next)) return;
                    setQuantity(Math.min(Math.max(1, next), Math.max(1, product.inventory)));
                  }}
                  className="w-14 border-x border-slate-200 py-2 text-center text-sm font-semibold outline-none"
                />
                <button
                  type="button"
                  className="px-3 py-2 text-lg font-bold text-slate-600 disabled:opacity-40"
                  onClick={() => setQuantity((current) => Math.min(product.inventory, current + 1))}
                  disabled={outOfStock || quantity >= product.inventory}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>

            <button
              type="button"
              className="btn-primary flex-1"
              disabled={outOfStock || busy}
              onClick={async () => {
                setBusy(true);
                await handleAddCart(product._id, quantity);
                setBusy(false);
              }}
            >
              {busy ? "Adding..." : "Add to cart"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => handleAddWishlist(product._id)}
            >
              Save to wishlist
            </button>
          </div>
        </div>
      </div>

      {!!peopleAlsoBought.length && (
        <section className="mt-10">
          <h2 className="mb-3 font-display text-xl font-bold">People also bought</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {peopleAlsoBought.map((related) => (
              <ProductCard
                key={related._id}
                product={related}
                onAddCart={(productId) => handleAddCart(productId, 1)}
                onAddWishlist={handleAddWishlist}
              />
            ))}
          </div>
        </section>
      )}
    </Container>
  );
};

export default ProductDetailPage;
