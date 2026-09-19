"use client";

import { useCallback, useEffect, useState } from "react";
import SearchBar from "@/components/SearchBar";
import CategoryFilter from "@/components/CategoryFilter";
import ProductTable from "@/components/ProductTable";
import Pagination from "@/components/Pagination";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Category, PaginatedProducts, Product } from "@/types";
import { deleteProduct, fetchProducts } from "@/lib/productApi";
import { fetchCategories } from "@/lib/categoryApi";

export default function ProductsPage() {
  const [data, setData] = useState<PaginatedProducts | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchProducts({ search, category_id: categoryId, page, page_size: 10 });
      setData(result);
    } finally {
      setLoading(false);
    }
  }, [search, categoryId, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  function handleSearch(value: string) {
    setPage(1);
    setSearch(value);
  }

  function handleCategoryChange(id: number | null) {
    setPage(1);
    setCategoryId(id);
  }

  async function confirmDelete() {
    if (!productToDelete) return;
    setDeleting(productToDelete.id);
    try {
      await deleteProduct(productToDelete.id);
      setProductToDelete(null);
      await load();
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Products</h1>
        {data && <p className="text-sm text-slate-500">{data.total} total</p>}
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <SearchBar initialValue={search} onSearch={handleSearch} />
        <CategoryFilter categories={categories} value={categoryId} onChange={handleCategoryChange} />
      </div>

      {loading && !data ? (
        <div className="card p-12 text-center text-slate-400">Loading products...</div>
      ) : (
        <>
          <ProductTable
            products={data?.items ?? []}
            onDelete={(product) => setProductToDelete(product)}
            isDeleting={deleting}
          />
          {data && (
            <Pagination page={data.page} totalPages={data.total_pages} onChange={setPage} />
          )}
        </>
      )}

      <ConfirmDialog
        open={!!productToDelete}
        title="Delete this product?"
        description={`"${productToDelete?.name}" will be permanently removed. This cannot be undone.`}
        onCancel={() => setProductToDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting !== null}
      />
    </div>
  );
}
