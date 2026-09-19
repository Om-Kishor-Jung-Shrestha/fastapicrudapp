import { api } from "./api";
import { Invitation } from "@/types";
import { TokenResponse } from "./authApi";

export async function fetchInvitations(): Promise<Invitation[]> {
  const { data } = await api.get<Invitation[]>("/admin/invitations");
  return data;
}

export async function inviteAdmin(email: string): Promise<Invitation> {
  const { data } = await api.post<Invitation>("/admin/invitations", { email });
  return data;
}

export async function revokeInvitation(id: number): Promise<void> {
  await api.delete(`/admin/invitations/${id}`);
}

export async function acceptInvitation(payload: {
  token: string;
  otp_code: string;
  full_name: string;
  password: string;
}) {
  const { data } = await api.post<TokenResponse>("/admin/invitations/accept", payload);
  return data;
}
