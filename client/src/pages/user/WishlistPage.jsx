import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { apiErrorMessage } from "../../api/client";
import Container from "../../components/layout/Container";
import EmptyState from "../../components/EmptyState";
import PageLoader from "../../components/PageLoader";
import { useCart } from "../../context/CartContext";
import { useToast } from "../../context/ToastContext";
import { currency } from "../../utils/format";

const WishlistPage = () => {
  const { addItem } = useCart();
  const { toast } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadWishlist = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/wishlist");
      setProducts(data.wishlist?.products || []);
    } catch (requestError) {
      setError(apiErrorMessage(requestError, "Could not load your wishlist"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWishlist();
  }, []);

  const remove = async (productId) => {
    try {
      const { data } = await api.delete(`/wishlist/${productId}`);
      setProducts(data.wishlist?.products || []);
      toast("Removed from wishlist", "success");
    } catch (requestError) {
      toast(apiErrorMessage(requestError, "Could not remove item"), "error");
    }
  };

  const addToCart = async (productId) => {
    try {
      await addItem(productId, 1);
      toast("Added to cart", "success");
    } catch (requestError) {
      toast(apiErrorMessage(requestError, "Could not add to cart"), "error");
    }
  };

  if (loading) return <PageLoader label="Loading wishlist..." />;

  if (error) {
    return (
      <Container>
        <EmptyState
          title="Wishlist unavailable"
          description={error}
          action={
            <button type="button" className="btn-primary" onClick={loadWishlist}>
              Retry
            </button>
          }
        />
      </Container>
    );
  }

  if (!products.length) {
    return (
      <Container>
        <EmptyState
          title="Your wishlist is empty"
          description="Save products you like and find them here later."
          action={
            <Link to="/" className="btn-primary">
              Browse products
            </Link>
          }
        />
      </Container>
    );
  }

  return (
    <Container>
      <h1 className="mb-4 font-display text-3xl font-bold">Wishlist</h1>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <div key={product._id} className="card-glass flex gap-4 rounded-2xl p-4">
            <Link to={`/products/${product._id}`}>
              <img
                src={product.imageUrl}
                alt={product.title}
                className="h-24 w-24 rounded-xl object-cover"
              />
            </Link>
            <div className="flex flex-1 flex-col">
              <Link
                to={`/products/${product._id}`}
                className="font-semibold text-ink hover:text-tide"
              >
                {product.title}
              </Link>
              <p className="text-xs uppercase tracking-wide text-tide">{product.category}</p>
              <p className="mt-1 text-sm font-bold text-ink">{currency(product.price)}</p>
              <div className="mt-auto flex flex-wrap gap-2 pt-3">
                <button
                  type="button"
                  className="btn-primary px-3 py-1.5"
                  onClick={() => addToCart(product._id)}
                  disabled={product.inventory < 1}
                >
                  Add to cart
                </button>
                <button
                  type="button"
                  className="text-xs font-semibold text-rose-600 hover:underline"
                  onClick={() => remove(product._id)}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Container>
  );
};

export default WishlistPage;
