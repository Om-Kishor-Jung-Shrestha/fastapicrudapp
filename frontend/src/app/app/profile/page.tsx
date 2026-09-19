"use client";

import { useEffect, useState, Suspense, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, KeyRound, Link2, Link2Off, Pencil, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { resolveImageUrl, getStoredToken, setStoredToken } from "@/lib/api";
import { googleLinkUrl, unlinkGoogle, updateProfile, changePassword } from "@/lib/authApi";
import ImageUploader from "@/components/ImageUploader";

const roleLabels: Record<string, string> = {
  user: "User",
  admin: "Admin",
  super_admin: "Super Admin",
};

export default function ProfilePage() {
  return (
    <Suspense fallback={null}>
      <ProfileContent />
    </Suspense>
  );
}

function ProfileContent() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [unlinking, setUnlinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justLinked, setJustLinked] = useState(false);

  const [editingProfile, setEditingProfile] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url ?? "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);

  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name);
      setAvatarUrl(user.avatar_url ?? "");
    }
  }, [user]);

  useEffect(() => {
    const token = params.get("token");
    const linked = params.get("linked");
    if (token && linked === "google") {
      setStoredToken(token);
      refreshUser().then(() => setJustLinked(true));
      router.replace("/app/profile");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  if (!user) return null;

  const avatar = resolveImageUrl(user.avatar_url);

  function handleConnectGoogle() {
    const token = getStoredToken();
    if (!token) return;
    // Full-page redirect -- Google's consent screen can't be an XHR/fetch call.
    window.location.href = googleLinkUrl(token);
  }

  async function handleUnlink() {
    setError(null);
    setUnlinking(true);
    try {
      await unlinkGoogle();
      await refreshUser();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Could not unlink Google account.";
      setError(message);
    } finally {
      setUnlinking(false);
    }
  }

  async function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(false);
    setSavingProfile(true);
    try {
      await updateProfile({ full_name: fullName, avatar_url: avatarUrl });
      await refreshUser();
      setProfileSuccess(true);
      setEditingProfile(false);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Could not update profile.";
      setProfileError(message);
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);
    setSavingPassword(true);
    try {
      await changePassword({ current_password: currentPassword, new_password: newPassword });
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setChangingPassword(false);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Could not change password.";
      setPasswordError(message);
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Profile &amp; Settings</h1>

      {justLinked && (
        <p className="text-sm text-green-700 bg-green-50 rounded-lg p-3 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Google account connected successfully.
        </p>
      )}

      <div className="card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {avatar ? (
              <img src={avatar} alt="" className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <div className="h-16 w-16 rounded-full bg-brand-600 text-white flex items-center justify-center text-xl font-semibold">
                {(user.full_name || user.email)[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-lg font-semibold text-slate-900">{user.full_name}</p>
              <p className="text-sm text-slate-500">{user.email}</p>
              <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-brand-600 bg-brand-50 rounded px-2 py-0.5">
                <ShieldCheck className="h-3 w-3" />
                {roleLabels[user.role] ?? user.role}
              </span>
            </div>
          </div>
          {!editingProfile && (
            <button className="btn-secondary shrink-0" onClick={() => setEditingProfile(true)}>
              <Pencil className="h-4 w-4" />
              Edit profile
            </button>
          )}
        </div>

        {profileSuccess && !editingProfile && (
          <p className="mt-4 text-sm text-green-700 bg-green-50 rounded-lg p-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Profile updated successfully.
          </p>
        )}

        {editingProfile && (
          <form onSubmit={handleSaveProfile} className="mt-5 pt-5 border-t border-slate-100 space-y-4">
            <ImageUploader value={avatarUrl} onChange={setAvatarUrl} label="Profile Picture" rounded />
            <div>
              <label className="label">Full name</label>
              <input
                required
                className="input max-w-sm"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            {profileError && <p className="text-sm text-red-600">{profileError}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setEditingProfile(false);
                  setFullName(user.full_name);
                  setAvatarUrl(user.avatar_url ?? "");
                  setProfileError(null);
                }}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={savingProfile}>
                {savingProfile ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">Password</h2>
            <p className="text-sm text-slate-500">Change your account password.</p>
          </div>
          {!changingPassword && (
            <button className="btn-secondary" onClick={() => setChangingPassword(true)}>
              <KeyRound className="h-4 w-4" />
              Change password
            </button>
          )}
        </div>

        {passwordSuccess && !changingPassword && (
          <p className="mt-4 text-sm text-green-700 bg-green-50 rounded-lg p-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Password changed successfully.
          </p>
        )}

        {changingPassword && (
          <form onSubmit={handleChangePassword} className="mt-5 pt-5 border-t border-slate-100 space-y-4 max-w-sm">
            <div>
              <label className="label">Current password</label>
              <input
                type="password"
                required
                className="input"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
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
            {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setChangingPassword(false);
                  setCurrentPassword("");
                  setNewPassword("");
                  setPasswordError(null);
                }}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={savingPassword}>
                {savingPassword ? "Saving..." : "Update password"}
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="card p-6">
        <h2 className="font-semibold text-slate-900 mb-1">Connected accounts</h2>
        <p className="text-sm text-slate-500 mb-4">
          Link your Google account for one-click sign-in. It must use the same
          email address as this account ({user.email}).
        </p>

        <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
          <div className="flex items-center gap-3">
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47c-.28 1.5-1.13 2.78-2.4 3.63v3.02h3.89c2.27-2.09 3.57-5.17 3.57-8.84z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.94-2.9l-3.89-3.02c-1.08.72-2.46 1.15-4.05 1.15-3.11 0-5.75-2.1-6.69-4.92H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
              <path fill="#FBBC05" d="M5.31 14.31A7.2 7.2 0 0 1 4.9 12c0-.8.14-1.58.4-2.31V6.6H1.29A11.98 11.98 0 0 0 0 12c0 1.93.46 3.76 1.29 5.4l4.02-3.09z" />
              <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.6 4.59 1.79l3.44-3.44C17.94 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.6l4.02 3.09c.94-2.82 3.58-4.92 6.69-4.92z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-slate-900">Google</p>
              {user.google_linked ? (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Connected as {user.google_email}
                </p>
              ) : (
                <p className="text-xs text-slate-400">Not connected</p>
              )}
            </div>
          </div>

          {user.google_linked ? (
            <button className="btn-secondary" onClick={handleUnlink} disabled={unlinking}>
              <Link2Off className="h-4 w-4" />
              {unlinking ? "Unlinking..." : "Disconnect"}
            </button>
          ) : (
            <button className="btn-primary" onClick={handleConnectGoogle}>
              <Link2 className="h-4 w-4" />
              Connect
            </button>
          )}
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
