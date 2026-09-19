"use client";

import { FormEvent, useEffect, useState } from "react";
import { Mail, ShieldAlert, Trash2, UserPlus } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { Invitation } from "@/types";
import { fetchInvitations, inviteAdmin, revokeInvitation } from "@/lib/invitationApi";

const statusStyles: Record<Invitation["status"], string> = {
  pending: "bg-amber-50 text-amber-700",
  accepted: "bg-green-50 text-green-700",
  revoked: "bg-slate-100 text-slate-500",
  expired: "bg-red-50 text-red-600",
};

export default function InviteAdminsPage() {
  const { isSuperAdmin } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      setInvitations(await fetchInvitations());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (!isSuperAdmin) {
    return (
      <div className="card p-10 text-center max-w-md mx-auto">
        <ShieldAlert className="h-8 w-8 text-amber-500 mx-auto mb-3" />
        <h2 className="font-semibold text-slate-900">Super Admins only</h2>
        <p className="text-sm text-slate-500 mt-1">
          Only the Super Admin can invite new admins to the team.
        </p>
      </div>
    );
  }

  async function handleInvite(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSending(true);
    try {
      await inviteAdmin(email);
      setSuccess(`Invitation sent to ${email}. They'll receive an email with a verification code.`);
      setEmail("");
      await load();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Could not send invitation.";
      setError(message);
    } finally {
      setSending(false);
    }
  }

  async function handleRevoke(id: number) {
    await revokeInvitation(id);
    await load();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Invite Admins</h1>

      <form onSubmit={handleInvite} className="card p-5 mb-6 max-w-lg">
        <label className="label">Admin&apos;s email address</label>
        <div className="flex gap-2">
          <input
            type="email"
            required
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="newadmin@company.com"
          />
          <button type="submit" className="btn-primary shrink-0" disabled={sending}>
            <UserPlus className="h-4 w-4" />
            {sending ? "Sending..." : "Invite"}
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          They&apos;ll get an email with a verification code that only works for that exact address.
        </p>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        {success && <p className="mt-2 text-sm text-green-700">{success}</p>}
      </form>

      {loading ? (
        <div className="card p-12 text-center text-slate-400">Loading invitations...</div>
      ) : invitations.length === 0 ? (
        <div className="card p-12 text-center text-slate-500">No invitations sent yet.</div>
      ) : (
        <div className="card divide-y divide-slate-100">
          {invitations.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="font-medium text-slate-900">{inv.email}</p>
                  <p className="text-xs text-slate-400">
                    Sent {new Date(inv.created_at).toLocaleDateString()} · Expires{" "}
                    {new Date(inv.expires_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusStyles[inv.status]}`}>
                  {inv.status}
                </span>
                {inv.status === "pending" && (
                  <button
                    className="btn-danger !px-2 !py-1.5"
                    onClick={() => handleRevoke(inv.id)}
                    title="Revoke invitation"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
