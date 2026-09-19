import Link from "next/link";
import {
  Boxes,
  Search,
  ShieldCheck,
  Zap,
  UploadCloud,
  Users,
  Mail,
} from "lucide-react";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";

const features = [
  {
    icon: Zap,
    title: "Redis-cached catalog",
    description: "Product listings and lookups are cached in Redis for instant page loads.",
  },
  {
    icon: Search,
    title: "Powerful search & filters",
    description: "Find products instantly by name, SKU, description, or category.",
  },
  {
    icon: UploadCloud,
    title: "Image uploads",
    description: "Attach product photos, stored locally and served straight from the API.",
  },
  {
    icon: Users,
    title: "Role-based team access",
    description: "Users create products; Admins manage categories; Super Admins invite the team.",
  },
  {
    icon: ShieldCheck,
    title: "Secure sign-in",
    description: "Email & password or continue with Google — your choice, always account-matched.",
  },
  {
    icon: Mail,
    title: "Email verification",
    description: "SMTP-powered OTP codes for password resets and admin invitations.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <LandingHeader />

      <main className="flex-1">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
              <Boxes className="h-3.5 w-3.5" />
              Postgres + Redis + Next.js
            </span>
            <h1 className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight text-slate-900">
              Manage your product catalog, effortlessly.
            </h1>
            <p className="mt-4 text-lg text-slate-600">
              A blazing-fast, cached product management system with categories,
              image uploads, and role-based team access — built for teams that
              move quickly.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register" className="btn-primary text-base px-6 py-3">
                Get started free
              </Link>
              <Link href="/login" className="btn-secondary text-base px-6 py-3">
                Sign in
              </Link>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-3 w-24 rounded bg-slate-200" />
              <div className="h-8 w-24 rounded-lg bg-brand-100" />
            </div>
            {[1, 2, 3].map((row) => (
              <div key={row} className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0">
                <div className="h-10 w-10 rounded-lg bg-slate-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-2.5 w-2/3 rounded bg-slate-200" />
                  <div className="h-2 w-1/3 rounded bg-slate-100" />
                </div>
                <div className="h-2.5 w-12 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        </section>

        <section id="about" className="bg-white border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Built for teams, not just individuals
            </h2>
            <p className="mt-3 max-w-2xl mx-auto text-slate-600">
              Any registered user can add products, while Admins keep categories
              tidy, and a Super Admin oversees the whole team by inviting new
              admins via secure, OTP-verified email invitations.
            </p>
          </div>
        </section>

        <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center">
            Everything you need
          </h2>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="card p-6">
                <div className="h-10 w-10 rounded-lg bg-brand-50 flex items-center justify-center">
                  <f.icon className="h-5 w-5 text-brand-600" />
                </div>
                <h3 className="mt-4 font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-1.5 text-sm text-slate-600">{f.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
