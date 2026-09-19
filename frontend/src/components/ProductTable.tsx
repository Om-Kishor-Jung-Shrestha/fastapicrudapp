"use client";

import Link from "next/link";
import { Pencil, Trash2, ImageOff } from "lucide-react";
import { Product } from "@/types";
import { resolveImageUrl } from "@/lib/api";

interface Props {
  products: Product[];
  onDelete: (product: Product) => void;
  isDeleting: number | null;
}

export default function ProductTable({ products, onDelete, isDeleting }: Props) {
  if (products.length === 0) {
    return (
      <div className="card p-12 text-center text-slate-500">
        No products found. Try adjusting your search or filters.
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
              Image
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
              Name / SKU
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
              Category
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">
              Price
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">
              Stock
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {products.map((product) => {
            const imgUrl = resolveImageUrl(product.image_url);
            return (
              <tr key={product.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden">
                    {imgUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imgUrl}
                        alt={product.name}
                        className="h-12 w-12 object-cover"
                      />
                    ) : (
                      <ImageOff className="h-5 w-5 text-slate-300" />
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{product.name}</div>
                  <div className="text-xs text-slate-500">SKU: {product.sku}</div>
                </td>
                <td className="px-4 py-3">
                  {product.category ? (
                    <span className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
                      {product.category.name}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">Uncategorized</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-medium text-slate-900">
                  ${Number(product.price).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={
                      product.stock_quantity > 0
                        ? "text-slate-700"
                        : "text-red-600 font-medium"
                    }
                  >
                    {product.stock_quantity}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/app/products/${product.id}/edit`}
                      className="btn-secondary !px-2 !py-1.5"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <button
                      className="btn-danger !px-2 !py-1.5"
                      title="Delete"
                      disabled={isDeleting === product.id}
                      onClick={() => onDelete(product)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
