import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    description: { type: String, required: true },
    category: { type: String, required: true, index: true },
    price: { type: Number, required: true, min: 0 },
    inventory: { type: Number, required: true, min: 0 },
    rating: { type: Number, default: 4.2 },
    imageUrl: { type: String, default: "https://picsum.photos/seed/amigo/640/480" },
    tags: [{ type: String }],
    totalSold: { type: Number, default: 0 },
    popularityScore: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const Product = mongoose.model("Product", productSchema);
