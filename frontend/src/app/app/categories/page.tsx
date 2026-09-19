"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, ShieldAlert, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import CategoryForm from "@/components/CategoryForm";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Category, CategoryFormValues } from "@/types";
import { createCategory, deleteCategory, fetchCategories, updateCategory } from "@/lib/categoryApi";

export default function CategoriesPage() {
  const { isAdmin } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [toDelete, setToDelete] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setCategories(await fetchCategories());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (!isAdmin) {
    return (
      <div className="card p-10 text-center max-w-md mx-auto">
        <ShieldAlert className="h-8 w-8 text-amber-500 mx-auto mb-3" />
        <h2 className="font-semibold text-slate-900">Admins only</h2>
        <p className="text-sm text-slate-500 mt-1">
          Only Admins and Super Admins can manage product categories.
        </p>
      </div>
    );
  }

  async function handleCreate(values: CategoryFormValues) {
    await createCategory(values);
    setShowForm(false);
    await load();
  }

  async function handleUpdate(values: CategoryFormValues) {
    if (!editing) return;
    await updateCategory(editing.id, values);
    setEditing(null);
    await load();
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteCategory(toDelete.id);
      setToDelete(null);
      await load();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Categories</h1>
        {!showForm && !editing && (
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            New Category
          </button>
        )}
      </div>

      {showForm && (
        <div className="mb-6">
          <CategoryForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {editing && (
        <div className="mb-6">
          <CategoryForm initial={editing} onSubmit={handleUpdate} onCancel={() => setEditing(null)} />
        </div>
      )}

      {loading ? (
        <div className="card p-12 text-center text-slate-400">Loading categories...</div>
      ) : categories.length === 0 ? (
        <div className="card p-12 text-center text-slate-500">No categories yet.</div>
      ) : (
        <div className="card divide-y divide-slate-100">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="font-medium text-slate-900">{c.name}</p>
                {c.description && <p className="text-sm text-slate-500">{c.description}</p>}
              </div>
              <div className="flex gap-2">
                <button className="btn-secondary !px-2 !py-1.5" onClick={() => setEditing(c)}>
                  <Pencil className="h-4 w-4" />
                </button>
                <button className="btn-danger !px-2 !py-1.5" onClick={() => setToDelete(c)}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Delete this category?"
        description={`"${toDelete?.name}" will be removed. Products in it become uncategorized.`}
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </div>
  );
}
