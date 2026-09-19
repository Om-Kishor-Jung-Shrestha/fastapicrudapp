"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import AuthCard from "@/components/auth/AuthCard";
import { forgotPassword } from "@/lib/authApi";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
      setTimeout(() => router.push(`/reset-password?email=${encodeURIComponent(email)}`), 1200);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Forgot your password?"
      subtitle="Enter your email and we'll send a one-time verification code."
    >
      {sent ? (
        <p className="text-sm text-green-700 bg-green-50 rounded-lg p-3">
          If that email exists, a 6-digit code has been sent. Redirecting you to enter it...
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              required
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
            <Mail className="h-4 w-4" />
            {loading ? "Sending code..." : "Send verification code"}
          </button>
        </form>
      )}
    </AuthCard>
  );
}
