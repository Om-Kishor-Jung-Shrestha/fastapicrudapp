"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import ProductForm from "@/components/ProductForm";
import { fetchProduct, updateProduct } from "@/lib/productApi";
import { Product, ProductFormValues } from "@/types";

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const productId = Number(params.id);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProduct(productId)
      .then(setProduct)
      .finally(() => setLoading(false));
  }, [productId]);

  async function handleUpdate(values: ProductFormValues) {
    await updateProduct(productId, values);
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading product...
      </div>
    );
  }

  if (!product) {
    return <p className="text-slate-500">Product not found.</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Edit Product</h1>
      <ProductForm initialProduct={product} onSubmit={handleUpdate} submitLabel="Save Changes" />
    </div>
  );
}
