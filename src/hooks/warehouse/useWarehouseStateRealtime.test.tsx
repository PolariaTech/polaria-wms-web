import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { WarehouseStateRow } from "@/modules/inventory/shared/types/inventory.types";
import {
  applyWarehouseStateRealtimeEvent,
  useWarehouseStateRealtime,
} from "./useWarehouseStateRealtime";

const listWarehouseState = vi.fn();

vi.mock("@/modules/inventory/shared/services/inventory.service", () => ({
  listWarehouseState: (...args: unknown[]) => listWarehouseState(...args),
}));

const getDomainSupabaseClient = vi.fn();

vi.mock("@/lib/supabase/domain-query", () => ({
  getDomainSupabaseClient: () => getDomainSupabaseClient(),
}));

vi.mock("@/providers/tenant/CompanyProvider", () => ({
  useCompany: () => ({
    activeBodegaId: "BOD-01",
    codigoCuenta: "CUENTA-01",
  }),
}));

let mockAccessToken: string | null = "token-a";

vi.mock("@/stores/auth.store", () => ({
  useAuthStore: (
    selector: (state: { accessToken: string | null }) => unknown,
  ) => selector({ accessToken: mockAccessToken }),
}));

function createRow(
  overrides: Partial<WarehouseStateRow> = {},
): WarehouseStateRow {
  return {
    id_warehouse_state: "ws-1",
    codigo_cuenta: "CUENTA-01",
    id_bodega: "BOD-01",
    id_ubicacion: "UBI-01",
    id_producto: "PROD-01",
    id_lote: null,
    cantidad: "10",
    cantidad_reservada: "0",
    temperatura: null,
    locked_by: null,
    locked_at: null,
    version: 1,
    updated_at: "2026-06-24T12:00:00.000Z",
    ...overrides,
  };
}

type PayloadHandler = (payload: {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: WarehouseStateRow;
  old: Partial<WarehouseStateRow>;
}) => void;

function createRealtimeChannelMock() {
  const handlers: PayloadHandler[] = [];
  let statusCallback:
    | ((status: string, err?: Error) => void)
    | undefined;

  const channel = {
    on: vi.fn(
      (
        _type: string,
        _filter: unknown,
        callback: PayloadHandler,
      ) => {
        handlers.push(callback);
        return channel;
      },
    ),
    subscribe: vi.fn((callback?: (status: string, err?: Error) => void) => {
      statusCallback = callback;
      queueMicrotask(() => callback?.("SUBSCRIBED"));
      return channel;
    }),
  };

  const client = {
    channel: vi.fn(() => channel),
    removeChannel: vi.fn(),
  };

  return {
    client,
    channel,
    handlers,
    emit(payload: Parameters<PayloadHandler>[0]) {
      for (const handler of handlers) {
        handler(payload);
      }
    },
    emitStatus(status: string, err?: Error) {
      statusCallback?.(status, err);
    },
  };
}

describe("applyWarehouseStateRealtimeEvent", () => {
  it("inserta filas nuevas al inicio", () => {
    const existing = [createRow({ id_warehouse_state: "ws-1" })];
    const inserted = createRow({ id_warehouse_state: "ws-2" });

    const next = applyWarehouseStateRealtimeEvent(
      existing,
      "INSERT",
      inserted,
      {},
    );

    expect(next).toHaveLength(2);
    expect(next[0]?.id_warehouse_state).toBe("ws-2");
  });

  it("actualiza filas existentes", () => {
    const existing = [createRow({ cantidad: "10" })];
    const updated = createRow({ cantidad: "25" });

    const next = applyWarehouseStateRealtimeEvent(
      existing,
      "UPDATE",
      updated,
      existing[0],
    );

    expect(next).toHaveLength(1);
    expect(next[0]?.cantidad).toBe("25");
  });

  it("elimina filas por id", () => {
    const existing = [
      createRow({ id_warehouse_state: "ws-1" }),
      createRow({ id_warehouse_state: "ws-2" }),
    ];

    const next = applyWarehouseStateRealtimeEvent(
      existing,
      "DELETE",
      undefined,
      { id_warehouse_state: "ws-1" },
    );

    expect(next).toHaveLength(1);
    expect(next[0]?.id_warehouse_state).toBe("ws-2");
  });
});

describe("useWarehouseStateRealtime", () => {
  beforeEach(() => {
    mockAccessToken = "token-a";
    listWarehouseState.mockReset();
    getDomainSupabaseClient.mockReset();
    vi.restoreAllMocks();
  });

  it("carga snapshot inicial y se suscribe al canal de la bodega", async () => {
    const initial = [createRow()];
    listWarehouseState.mockResolvedValue(initial);
    const realtime = createRealtimeChannelMock();
    getDomainSupabaseClient.mockReturnValue(realtime.client);

    const { result, unmount } = renderHook(() =>
      useWarehouseStateRealtime({ idBodega: "BOD-01" }),
    );

    await waitFor(() => {
      expect(result.current.rows).toEqual(initial);
      expect(result.current.isConnected).toBe(true);
    });

    expect(listWarehouseState).toHaveBeenCalledWith({
      idBodega: "BOD-01",
      codigoCuenta: "CUENTA-01",
    });
    expect(realtime.client.channel).toHaveBeenCalledWith("warehouse_state:BOD-01");
    expect(realtime.channel.on).toHaveBeenCalledTimes(3);
    expect(realtime.channel.subscribe).toHaveBeenCalledTimes(1);

    unmount();

    expect(realtime.client.removeChannel).toHaveBeenCalledWith(realtime.channel);
  });

  it("fusiona eventos INSERT, UPDATE y DELETE", async () => {
    listWarehouseState.mockResolvedValue([createRow({ cantidad: "10" })]);
    const realtime = createRealtimeChannelMock();
    getDomainSupabaseClient.mockReturnValue(realtime.client);

    const { result } = renderHook(() =>
      useWarehouseStateRealtime({ idBodega: "BOD-01" }),
    );

    await waitFor(() => expect(result.current.isConnected).toBe(true));

    act(() => {
      realtime.emit({
        eventType: "INSERT",
        new: createRow({ id_warehouse_state: "ws-2", cantidad: "3" }),
        old: {},
      });
    });

    expect(result.current.rows).toHaveLength(2);
    expect(result.current.lastEventAt).toBeInstanceOf(Date);

    act(() => {
      realtime.emit({
        eventType: "UPDATE",
        new: createRow({ cantidad: "99" }),
        old: createRow({ cantidad: "10" }),
      });
    });

    expect(
      result.current.rows.find((row) => row.id_warehouse_state === "ws-1")
        ?.cantidad,
    ).toBe("99");

    act(() => {
      realtime.emit({
        eventType: "DELETE",
        new: {} as WarehouseStateRow,
        old: { id_warehouse_state: "ws-2" },
      });
    });

    expect(result.current.rows).toHaveLength(1);
    expect(result.current.rows[0]?.id_warehouse_state).toBe("ws-1");
  });

  it("re-suscribe al cambiar bodega o JWT", async () => {
    listWarehouseState.mockResolvedValue([]);
    const realtimeA = createRealtimeChannelMock();
    const realtimeB = createRealtimeChannelMock();
    getDomainSupabaseClient
      .mockReturnValueOnce(realtimeA.client)
      .mockReturnValueOnce(realtimeB.client)
      .mockReturnValue(realtimeB.client);

    const { rerender, unmount } = renderHook(
      ({ idBodega }: { idBodega: string }) =>
        useWarehouseStateRealtime({ idBodega }),
      { initialProps: { idBodega: "BOD-01" } },
    );

    await waitFor(() =>
      expect(realtimeA.client.channel).toHaveBeenCalledWith(
        "warehouse_state:BOD-01",
      ),
    );

    rerender({ idBodega: "BOD-02" });

    await waitFor(() =>
      expect(realtimeB.client.channel).toHaveBeenCalledWith(
        "warehouse_state:BOD-02",
      ),
    );
    expect(realtimeA.client.removeChannel).toHaveBeenCalled();

    mockAccessToken = "token-b";
    rerender({ idBodega: "BOD-02" });

    await waitFor(() =>
      expect(realtimeB.client.removeChannel).toHaveBeenCalled(),
    );

    unmount();
  });
});
