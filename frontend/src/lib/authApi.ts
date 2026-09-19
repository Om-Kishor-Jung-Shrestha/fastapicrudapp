import { api, API_BASE_URL } from "./api";
import { User } from "@/types";

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export async function registerUser(payload: {
  email: string;
  password: string;
  full_name: string;
}): Promise<TokenResponse> {
  const { data } = await api.post<TokenResponse>("/auth/register", payload);
  return data;
}

export async function loginUser(payload: {
  email: string;
  password: string;
}): Promise<TokenResponse> {
  const { data } = await api.post<TokenResponse>("/auth/login", payload);
  return data;
}

export async function fetchMe(): Promise<User> {
  const { data } = await api.get<User>("/auth/me");
  return data;
}

export async function updateProfile(payload: {
  full_name?: string;
  avatar_url?: string;
}): Promise<User> {
  const { data } = await api.put<User>("/auth/me", payload);
  return data;
}

export async function changePassword(payload: {
  current_password: string;
  new_password: string;
}): Promise<{ message: string }> {
  const { data } = await api.post("/auth/change-password", payload);
  return data;
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  const { data } = await api.post("/auth/forgot-password", { email });
  return data;
}

export async function resetPassword(payload: {
  email: string;
  code: string;
  new_password: string;
}): Promise<{ message: string }> {
  const { data } = await api.post("/auth/reset-password", payload);
  return data;
}

export async function unlinkGoogle(): Promise<User> {
  const { data } = await api.post<User>("/auth/google/unlink");
  return data;
}

export function googleLoginUrl(): string {
  return `${API_BASE_URL}/auth/google/login`;
}

export function googleLinkUrl(token: string): string {
  return `${API_BASE_URL}/auth/google/link?token=${encodeURIComponent(token)}`;
}
