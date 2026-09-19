"use client";

import { Category } from "@/types";

interface Props {
  categories: Category[];
  value: number | null;
  onChange: (categoryId: number | null) => void;
}

export default function CategoryFilter({ categories, value, onChange }: Props) {
  return (
    <select
      className="input max-w-[220px]"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
    >
      <option value="">All Categories</option>
      {categories.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}
