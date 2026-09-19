"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound } from "lucide-react";
import AuthCard from "@/components/auth/AuthCard";
import { resetPassword } from "@/lib/authApi";

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState(params.get("email") || "");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await resetPassword({ email, code, new_password: newPassword });
      setSuccess(true);
      setTimeout(() => router.push("/login"), 1500);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Invalid or expired code.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard title="Enter verification code" subtitle="Check your email for the 6-digit code we sent you.">
      {success ? (
        <p className="text-sm text-green-700 bg-green-50 rounded-lg p-3">
          Password reset! Redirecting you to sign in...
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
            />
          </div>
          <div>
            <label className="label">6-digit code</label>
            <input
              type="text"
              required
              maxLength={6}
              className="input tracking-[0.5em] text-center font-mono text-lg"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
            />
          </div>
          <div>
            <label className="label">New password</label>
            <input
              type="password"
              required
              minLength={8}
              className="input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
            <KeyRound className="h-4 w-4" />
            {loading ? "Resetting..." : "Reset password"}
          </button>
        </form>
      )}
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
