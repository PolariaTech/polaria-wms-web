import { getApiBaseUrl } from "@/config/env";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  auth?: boolean;
};

let accessTokenGetter: (() => string | null) | null = null;

export function setAccessTokenGetter(getter: () => string | null) {
  accessTokenGetter = getter;
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as {
      message?: string | string[];
      error?: string;
    };
    const message = data.message ?? data.error;
    if (Array.isArray(message)) return message.join(", ");
    if (typeof message === "string") return message;
  } catch {
    // ignore parse errors
  }
  return response.statusText || "Error desconocido";
}

export function mapApiError(status: number, fallback?: string): ApiError {
  switch (status) {
    case 401:
      return new ApiError("Credenciales inválidas", status);
    case 403:
      return new ApiError(
        "No autorizado para esta empresa/cuenta",
        status,
      );
    case 404:
      return new ApiError(
        fallback ?? "Usuario no encontrado o inactivo",
        status,
      );
    case 422:
      return new ApiError("Debes ingresar código de empresa", status);
    default:
      if (status >= 500) {
        return new ApiError(
          "Error del servidor. Intenta de nuevo más tarde.",
          status,
        );
      }
      return new ApiError(
        fallback ?? "Ocurrió un error inesperado",
        status,
      );
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, auth = false, headers, ...rest } = options;

  const requestHeaders = new Headers(headers);
  requestHeaders.set("Content-Type", "application/json");

  if (auth) {
    const token = accessTokenGetter?.();
    if (token) {
      requestHeaders.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...rest,
    headers: requestHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    throw mapApiError(response.status, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
