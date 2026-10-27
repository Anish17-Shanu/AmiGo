import { useRef, useState } from "react";
import api, { apiErrorMessage } from "../../api/client";
import { useToast } from "../../context/ToastContext";
import { currency } from "../../utils/format";

const EMPTY_FORM = {
  title: "",
  category: "",
  price: "",
  inventory: "",
  imageUrl: "",
  tags: "",
  description: ""
};

const ProductManager = ({ products, onChanged }) => {
  const { toast } = useToast();
  const formRef = useRef(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const setField = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const startEdit = (product) => {
    setEditingId(product._id);
    setForm({
      title: product.title || "",
      category: product.category || "",
      price: String(product.price ?? ""),
      inventory: String(product.inventory ?? ""),
      imageUrl: product.imageUrl || "",
      tags: (product.tags || []).join(", "),
      description: product.description || ""
    });
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);

    const payload = {
      title: form.title.trim(),
      category: form.category.trim(),
      price: Number(form.price),
      inventory: Number(form.inventory),
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    };
    if (form.description.trim()) payload.description = form.description.trim();
    if (form.imageUrl.trim()) payload.imageUrl = form.imageUrl.trim();

    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
        toast("Product updated", "success");
      } else {
        await api.post("/products", payload);
        toast("Product created", "success");
      }
      resetForm();
      onChanged();
    } catch (requestError) {
      toast(apiErrorMessage(requestError, "Could not save product"), "error");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (product) => {
    if (!window.confirm(`Delete "${product.title}"? This cannot be undone.`)) return;
    setDeletingId(product._id);
    try {
      await api.delete(`/products/${product._id}`);
      toast("Product deleted", "success");
      if (editingId === product._id) resetForm();
      onChanged();
    } catch (requestError) {
      toast(apiErrorMessage(requestError, "Could not delete product"), "error");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section ref={formRef} className="card-glass rounded-2xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-xl font-bold">
          {editingId ? "Edit product" : "Create product"}
        </h2>
        {editingId && (
          <button type="button" onClick={resetForm} className="btn-secondary px-3 py-1.5">
            Cancel edit
          </button>
        )}
      </div>

      <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="product-title" className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
            Title
          </label>
          <input id="product-title" required value={form.title} onChange={setField("title")} className="input" />
        </div>

        <div>
          <label htmlFor="product-category-new" className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
            Category
          </label>
          <input id="product-category-new" required value={form.category} onChange={setField("category")} className="input" />
        </div>

        <div>
          <label htmlFor="product-tags" className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
            Tags (comma separated)
          </label>
          <input id="product-tags" value={form.tags} onChange={setField("tags")} className="input" />
        </div>

        <div>
          <label htmlFor="product-price" className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
            Price
          </label>
          <input
            id="product-price"
            type="number"
            required
            min="0"
            step="0.01"
            value={form.price}
            onChange={setField("price")}
            className="input"
          />
        </div>

        <div>
          <label htmlFor="product-inventory" className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
            Inventory
          </label>
          <input
            id="product-inventory"
            type="number"
            required
            min="0"
            step="1"
            value={form.inventory}
            onChange={setField("inventory")}
            className="input"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="product-image" className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
            Image URL (optional)
          </label>
          <input id="product-image" type="url" value={form.imageUrl} onChange={setField("imageUrl")} className="input" />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="product-description" className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
            Description (optional)
          </label>
          <textarea
            id="product-description"
            rows={3}
            value={form.description}
            onChange={setField("description")}
            className="input"
          />
        </div>

        <div className="sm:col-span-2">
          <button type="submit" disabled={busy} className="btn-primary">
            {busy ? "Saving..." : editingId ? "Update product" : "Create product"}
          </button>
        </div>
      </form>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <th className="py-2 pr-3">Product</th>
              <th className="py-2 pr-3">Category</th>
              <th className="py-2 pr-3">Price</th>
              <th className="py-2 pr-3">Stock</th>
              <th className="py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product._id} className="border-b border-slate-100">
                <td className="py-2 pr-3 font-semibold text-slate-700">{product.title}</td>
                <td className="py-2 pr-3 text-slate-600">{product.category}</td>
                <td className="py-2 pr-3 text-slate-600">{currency(product.price)}</td>
                <td className="py-2 pr-3 text-slate-600">{product.inventory}</td>
                <td className="py-2 text-right">
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => startEdit(product)} className="btn-secondary px-3 py-1.5">
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(product)}
                      disabled={deletingId === product._id}
                      className="btn-danger px-3 py-1.5"
                    >
                      {deletingId === product._id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!products.length && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-slate-500">
                  No products yet. Create the first one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default ProductManager;
