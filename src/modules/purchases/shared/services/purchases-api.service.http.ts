import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { ApiError, apiRequest } from "@/services/api/api";

export async function requestComprasApi<T>(
  path: string,
  options: { method?: "GET" | "POST" | "PATCH"; body?: unknown } = {},
): Promise<T> {
  try {
    return await apiRequest<T>(path, {
      method: options.method ?? "GET",
      auth: true,
      body: options.body,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw new DomainServiceError(error.message, "MUTATION_FAILED", error);
    }
    throw error;
  }
}

export async function postComprasApi<T>(path: string, body?: unknown): Promise<T> {
  return requestComprasApi<T>(path, { method: "POST", body });
}