import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { currency } from "../../utils/format";

const ProductCard = ({ product, onAddCart, onAddWishlist }) => {
  const outOfStock = product.inventory < 1;

  return (
    <motion.article whileHover={{ y: -4 }} className="card-glass overflow-hidden rounded-2xl">
      <Link to={`/products/${product._id}`} className="block">
        <img src={product.imageUrl} alt={product.title} className="h-44 w-full object-cover" />
      </Link>
      <div className="space-y-2 p-4">
        <Link to={`/products/${product._id}`} className="block">
          <h3 className="font-display text-lg font-bold text-ink hover:text-tide">{product.title}</h3>
        </Link>
        <p className="line-clamp-2 text-sm text-slate-600">{product.description}</p>
        <p className="text-xs font-semibold uppercase tracking-wide text-tide">{product.category}</p>
        <div className="flex items-center justify-between">
          <span className="text-lg font-extrabold text-ink">{currency(product.price)}</span>
          <span className={`text-xs font-semibold ${outOfStock ? "text-rose-600" : "text-slate-500"}`}>
            {outOfStock ? "Out of stock" : `Stock: ${product.inventory}`}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onAddCart(product._id)}
            disabled={outOfStock}
            className="btn-primary flex-1"
          >
            Add to Cart
          </button>
          <button
            type="button"
            onClick={() => onAddWishlist(product._id)}
            className="btn-secondary"
            aria-label={`Save ${product.title} to wishlist`}
          >
            Save
          </button>
        </div>
      </div>
    </motion.article>
  );
};

export default ProductCard;
