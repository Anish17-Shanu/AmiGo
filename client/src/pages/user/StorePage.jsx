import { useEffect, useMemo, useState } from "react";
import api from "../../api/client";
import ProductCard from "../../components/products/ProductCard";
import Container from "../../components/layout/Container";

const StorePage = () => {
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [recommendations, setRecommendations] = useState([]);

  const fetchProducts = async () => {
    const { data } = await api.get("/products", { params: { q: query, category } });
    setProducts(data.items || []);
  };

  const fetchRecommendations = async () => {
    try {
      const { data } = await api.get("/analytics/recommendations");
      setRecommendations(data.recommendations || []);
    } catch {
      setRecommendations([]);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [query, category]);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const categories = useMemo(() => [...new Set(products.map((p) => p.category))], [products]);

  const onAddCart = async (productId) => {
    await api.post("/cart", { productId, quantity: 1 });
    alert("Added to cart");
  };

  const onAddWishlist = async (productId) => {
    await api.post("/wishlist", { productId });
    alert("Saved to wishlist");
  };

  return (
    <Container>
      <section className="mb-6 rounded-3xl bg-hero p-6 text-white">
        <h1 className="font-display text-3xl font-extrabold">AmiGo Smart Store</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-200">Data-ranked discovery, AI recommendations, and real-time commerce intelligence in one seamless marketplace.</p>
      </section>

      <div className="mb-6 grid gap-3 md:grid-cols-3">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products" className="rounded-xl border border-slate-300 px-3 py-2" />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-xl border border-slate-300 px-3 py-2">
          <option value="">All categories</option>
          {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        <button onClick={fetchProducts} className="rounded-xl bg-ink px-4 py-2 font-semibold text-white">Apply Filters</button>
      </div>

      <h2 className="mb-3 font-display text-xl font-bold">Products</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} onAddCart={onAddCart} onAddWishlist={onAddWishlist} />
        ))}
      </div>

      {!!recommendations.length && (
        <section className="mt-8">
          <h2 className="mb-3 font-display text-xl font-bold">Recommended For You</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {recommendations.map((product) => (
              <ProductCard key={product._id} product={product} onAddCart={onAddCart} onAddWishlist={onAddWishlist} />
            ))}
          </div>
        </section>
      )}
    </Container>
  );
};

export default StorePage;
