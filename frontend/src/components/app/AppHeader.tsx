"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Boxes, ChevronDown, LogOut, Settings, UserCircle } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { resolveImageUrl } from "@/lib/api";

export default function AppHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleLogout() {
    logout();
    router.push("/");
  }

  const avatar = resolveImageUrl(user?.avatar_url);
  const initials = (user?.full_name || user?.email || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-20 h-16 bg-white border-b border-slate-200">
      <div className="h-full px-4 sm:px-6 flex items-center justify-between">
        <Link href="/app" className="flex items-center gap-2 font-bold text-slate-900">
          <Boxes className="h-6 w-6 text-brand-600" />
          <span className="hidden sm:inline">Product Manager</span>
        </Link>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 hover:bg-slate-100"
          >
            {avatar ? (
              <img src={avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-semibold">
                {initials}
              </div>
            )}
            <span className="hidden sm:inline text-sm font-medium text-slate-700">
              {user?.full_name?.split(" ")[0]}
            </span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white shadow-lg py-2">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-sm font-medium text-slate-900 truncate">{user?.full_name}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
              <Link
                href="/app/profile"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <UserCircle className="h-4 w-4" />
                View profile
              </Link>
              <Link
                href="/app/profile"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
