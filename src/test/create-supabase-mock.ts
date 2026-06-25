import type { SupabaseClient } from "@supabase/supabase-js";
import { vi } from "vitest";

interface SupabaseMockOptions {
  data?: unknown;
  error?: { message: string } | null;
}

/** Crea un cliente Supabase encadenable para tests de servicios de dominio. */
export function createSupabaseMock({
  data = [],
  error = null,
}: SupabaseMockOptions = {}) {
  const chain = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    is: vi.fn(),
    in: vi.fn(),
  };

  chain.select.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.order.mockReturnValue(chain);
  chain.is.mockReturnValue(chain);
  chain.in.mockReturnValue(chain);
  chain.limit.mockResolvedValue({ data, error });

  const from = vi.fn(() => chain);
  const channel = vi.fn(() => ({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn(),
  }));
  const removeChannel = vi.fn();

  const client = {
    from,
    channel,
    removeChannel,
  } as unknown as SupabaseClient;

  return { client, from, chain };
}
