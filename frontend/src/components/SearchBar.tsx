"use client";

import { Search } from "lucide-react";
import { FormEvent, useState } from "react";

interface Props {
  initialValue?: string;
  onSearch: (value: string) => void;
}

export default function SearchBar({ initialValue = "", onSearch }: Props) {
  const [value, setValue] = useState(initialValue);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSearch(value.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="flex-1 min-w-[220px] flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search by name, description or SKU..."
          className="input pl-9"
        />
      </div>
      <button type="submit" className="btn-primary shrink-0">
        <Search className="h-4 w-4" />
        Search
      </button>
    </form>
  );
}
