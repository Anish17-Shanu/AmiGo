import { useEffect, useState } from "react";
import api from "../../api/client";
import Container from "../../components/layout/Container";

const WishlistPage = () => {
  const [products, setProducts] = useState([]);

  const loadWishlist = async () => {
    const { data } = await api.get("/wishlist");
    setProducts(data.wishlist?.products || []);
  };

  useEffect(() => {
    loadWishlist();
  }, []);

  const remove = async (productId) => {
    await api.delete(`/wishlist/${productId}`);
    loadWishlist();
  };

  return (
    <Container>
      <h1 className="mb-4 font-display text-3xl font-bold">Wishlist</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {products.map((product) => (
          <div key={product._id} className="card-glass rounded-xl p-4">
            <h3 className="font-semibold">{product.title}</h3>
            <p className="text-sm text-slate-600">{product.category}</p>
            <button onClick={() => remove(product._id)} className="mt-3 rounded bg-rose-100 px-3 py-1 text-rose-600">Remove</button>
          </div>
        ))}
      </div>
    </Container>
  );
};

export default WishlistPage;
