import { motion } from "framer-motion";
import { currency } from "../../utils/format";

const ProductCard = ({ product, onAddCart, onAddWishlist }) => {
  return (
    <motion.article
      whileHover={{ y: -4 }}
      className="card-glass overflow-hidden rounded-2xl"
    >
      <img src={product.imageUrl} alt={product.title} className="h-44 w-full object-cover" />
      <div className="space-y-2 p-4">
        <h3 className="font-display text-lg font-bold text-ink">{product.title}</h3>
        <p className="line-clamp-2 text-sm text-slate-600">{product.description}</p>
        <p className="font-semibold text-tide">{product.category}</p>
        <div className="flex items-center justify-between">
          <span className="text-lg font-extrabold text-ink">{currency(product.price)}</span>
          <span className="text-xs text-slate-500">Stock: {product.inventory}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onAddCart(product._id)} className="flex-1 rounded bg-ink px-3 py-2 text-sm font-semibold text-white">Add to Cart</button>
          <button onClick={() => onAddWishlist(product._id)} className="rounded border border-slate-300 px-3 py-2 text-sm font-semibold">Save</button>
        </div>
      </div>
    </motion.article>
  );
};

export default ProductCard;
