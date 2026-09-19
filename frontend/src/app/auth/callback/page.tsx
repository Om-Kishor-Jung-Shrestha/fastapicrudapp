"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { setStoredToken } from "@/lib/api";
import { fetchMe } from "@/lib/authApi";
import { useAuth } from "@/lib/AuthContext";

function CallbackHandler() {
  const router = useRouter();
  const params = useSearchParams();
  const { setSession } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setError("Missing authentication token from Google.");
      return;
    }
    setStoredToken(token);
    fetchMe()
      .then((user) => {
        setSession(token, user);
        router.replace("/app");
      })
      .catch(() => setError("Could not complete Google sign-in. Please try again."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-slate-600">
      {error ? (
        <p className="text-red-600">{error}</p>
      ) : (
        <>
          <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
          <p>Finishing Google sign-in...</p>
        </>
      )}
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={null}>
      <CallbackHandler />
    </Suspense>
  );
}
