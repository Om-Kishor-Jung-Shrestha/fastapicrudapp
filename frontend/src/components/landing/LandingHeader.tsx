"use client";

import Link from "next/link";
import { useState } from "react";
import { Boxes, Menu, X } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

const navLinks = [
  { href: "#about", label: "About" },
  { href: "#features", label: "Features" },
  { href: "#contact", label: "Contact" },
];

export default function LandingHeader() {
  const { isAuthenticated, user } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-slate-900 text-lg">
          <Boxes className="h-6 w-6 text-brand-600" />
          Product Manager
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-brand-600">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <Link href="/app" className="btn-primary">
              Go to Dashboard, {user?.full_name?.split(" ")[0]}
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn-secondary">
                Sign In
              </Link>
              <Link href="/register" className="btn-primary">
                Sign Up
              </Link>
            </>
          )}
        </div>

        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="block text-slate-600">
              {link.label}
            </a>
          ))}
          <div className="flex gap-2 pt-2">
            {isAuthenticated ? (
              <Link href="/app" className="btn-primary w-full">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="btn-secondary flex-1">
                  Sign In
                </Link>
                <Link href="/register" className="btn-primary flex-1">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
