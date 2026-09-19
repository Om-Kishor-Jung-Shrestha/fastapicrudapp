"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { Category, Product, ProductFormValues } from "@/types";
import ImageUploader from "@/components/ImageUploader";
import { fetchCategories } from "@/lib/categoryApi";

interface Props {
  initialProduct?: Product;
  onSubmit: (values: ProductFormValues) => Promise<void>;
  submitLabel?: string;
}

const emptyValues: ProductFormValues = {
  name: "",
  description: "",
  sku: "",
  price: 0,
  stock_quantity: 0,
  image_url: "",
  category_id: null,
};

export default function ProductForm({ initialProduct, onSubmit, submitLabel = "Save Product" }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<ProductFormValues>(emptyValues);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (initialProduct) {
      setValues({
        name: initialProduct.name,
        description: initialProduct.description || "",
        sku: initialProduct.sku,
        price: Number(initialProduct.price),
        stock_quantity: initialProduct.stock_quantity,
        image_url: initialProduct.image_url || "",
        category_id: initialProduct.category_id,
      });
    }
  }, [initialProduct]);

  function update<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await onSubmit(values);
      router.push("/app");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Something went wrong while saving the product.";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-5 max-w-2xl">
      <ImageUploader value={values.image_url} onChange={(url) => update("image_url", url)} />

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Product Name</label>
          <input
            required
            className="input"
            value={values.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Wireless Mouse"
          />
        </div>
        <div>
          <label className="label">SKU</label>
          <input
            required
            className="input"
            value={values.sku}
            onChange={(e) => update("sku", e.target.value)}
            placeholder="WM-1001"
          />
        </div>
      </div>

      <div>
        <label className="label">Description</label>
        <textarea
          className="input min-h-[90px]"
          value={values.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder="Short product description..."
        />
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label className="label">Price ($)</label>
          <input
            required
            type="number"
            step="0.01"
            min="0"
            className="input"
            value={values.price}
            onChange={(e) => update("price", parseFloat(e.target.value) || 0)}
          />
        </div>
        <div>
          <label className="label">Stock Quantity</label>
          <input
            required
            type="number"
            min="0"
            className="input"
            value={values.stock_quantity}
            onChange={(e) => update("stock_quantity", parseInt(e.target.value) || 0)}
          />
        </div>
        <div>
          <label className="label">Category</label>
          <select
            className="input"
            value={values.category_id ?? ""}
            onChange={(e) => update("category_id", e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Uncategorized</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn-secondary" onClick={() => router.push("/app")}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={saving}>
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
