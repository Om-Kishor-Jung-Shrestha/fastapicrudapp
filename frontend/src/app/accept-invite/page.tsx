"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import AuthCard from "@/components/auth/AuthCard";
import { acceptInvitation } from "@/lib/invitationApi";
import { useAuth } from "@/lib/AuthContext";

function AcceptInviteForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { setSession } = useAuth();
  const [otp, setOtp] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = params.get("token") || "";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!token) {
      setError("This invitation link is missing its token.");
      return;
    }
    setLoading(true);
    try {
      const res = await acceptInvitation({
        token,
        otp_code: otp,
        full_name: fullName,
        password,
      });
      setSession(res.access_token, res.user);
      router.push("/app");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Could not accept this invitation.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Accept your admin invitation"
      subtitle="Enter the verification code from your invite email to set up your account."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Verification code</label>
          <input
            type="text"
            required
            maxLength={6}
            className="input tracking-[0.5em] text-center font-mono text-lg"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
          />
        </div>
        <div>
          <label className="label">Full name</label>
          <input
            type="text"
            required
            className="input"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Set a password</label>
          <input
            type="password"
            required
            minLength={8}
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
          <ShieldCheck className="h-4 w-4" />
          {loading ? "Setting up..." : "Accept invitation"}
        </button>
      </form>
    </AuthCard>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={null}>
      <AcceptInviteForm />
    </Suspense>
  );
}
