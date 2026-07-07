import { normalizeAuthSession } from "@/lib/utils/normalize-nivel-rol";
import type { AuthSessionApi } from "@/lib/utils/normalize-nivel-rol";
import { apiRequest } from "@/services/api/api";
import type {
  AuthSession,
  LoginRequest,
  LoginResponse,
  MateoExchangeResponse,
  MateoHandoffResponse,
  PreloginRequest,
  PreloginResponse,
} from "@/types/auth/auth";

type MeApiResponse = AuthSessionApi;

const WMS_AUTH_HEADERS = { "X-Auth-Client": "wms" };

export async function prelogin(
  payload: PreloginRequest,
): Promise<PreloginResponse> {
  return apiRequest<PreloginResponse>("/auth/prelogin", {
    method: "POST",
    body: payload,
    headers: WMS_AUTH_HEADERS,
  });
}

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  return apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: payload,
    headers: WMS_AUTH_HEADERS,
  });
}

export async function mateoHandoff(): Promise<MateoHandoffResponse> {
  return apiRequest<MateoHandoffResponse>("/auth/mateo-handoff", {
    method: "POST",
    auth: true,
  });
}

export async function wmsSsoExchange(
  code: string,
): Promise<MateoExchangeResponse> {
  return apiRequest<MateoExchangeResponse>("/auth/mateo-exchange", {
    method: "POST",
    body: { code },
  });
}

export async function getMe(): Promise<AuthSession> {
  const raw = await apiRequest<MeApiResponse>("/auth/me", {
    method: "GET",
    auth: true,
  });
  return normalizeAuthSession(raw);
}

export async function logout(): Promise<void> {
  return apiRequest<void>("/auth/logout", {
    method: "POST",
    auth: true,
  });
}

export async function logoutWithToken(accessToken: string): Promise<void> {
  return apiRequest<void>("/auth/logout", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}
