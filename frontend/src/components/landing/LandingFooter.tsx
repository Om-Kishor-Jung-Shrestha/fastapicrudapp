import Link from "next/link";
import { Boxes } from "lucide-react";

export default function LandingFooter() {
  return (
    <footer id="contact" className="border-t border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 sm:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-2 font-bold text-slate-900 mb-2">
            <Boxes className="h-5 w-5 text-brand-600" />
            Product Manager
          </div>
          <p className="text-sm text-slate-500">
            A fast, cached product catalog with role-based team management.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-900 mb-2">Product</h4>
          <ul className="space-y-1 text-sm text-slate-500">
            <li><a href="#features" className="hover:text-brand-600">Features</a></li>
            <li><a href="#about" className="hover:text-brand-600">About</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-900 mb-2">Account</h4>
          <ul className="space-y-1 text-sm text-slate-500">
            <li><Link href="/login" className="hover:text-brand-600">Sign In</Link></li>
            <li><Link href="/register" className="hover:text-brand-600">Sign Up</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Product Manager. All rights reserved.
      </div>
    </footer>
  );
}
