import { renderHook, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useNotificationRealtime } from "@/hooks/useNotificationRealtime";

const state = vi.hoisted(() => ({ token: "token-one" as string | null, scope: "tenant-one", demo: false,
  handlers: {} as Record<string, () => void>, invalidation: vi.fn(), connect: vi.fn(), disconnect: vi.fn(), remove: vi.fn(), io: vi.fn() }));
vi.mock("socket.io-client", () => ({ io: state.io }));
vi.mock("@tanstack/react-query", () => ({ useQueryClient: () => ({ invalidateQueries: state.invalidation }) }));
vi.mock("@/services/api.service", () => ({ apiService: { getAuthToken: () => state.token } }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: { organization_id: state.scope } }) }));
vi.mock("@/demo/session", () => ({ isDemoSession: () => state.demo }));
beforeEach(() => {
  vi.useFakeTimers(); vi.clearAllMocks(); state.token = "token-one"; state.demo = false; state.scope = "tenant-one"; state.handlers = {};
  state.io.mockReturnValue({ on: (event: string, handler: () => void) => { state.handlers[event] = handler; },
    connect: state.connect, disconnect: state.disconnect, removeAllListeners: state.remove });
});
afterEach(() => { vi.useRealTimers(); });

describe("notification Socket.IO invalidation", () => {
  it("authenticates without URL tokens and recovers REST state on connect and events", () => {
    const view = renderHook(() => useNotificationRealtime());
    expect(state.connect).toHaveBeenCalledOnce();
    const options = state.io.mock.calls[0][1];
    const auth = vi.fn(); options.auth(auth);
    expect(auth).toHaveBeenCalledWith({ token: "token-one", portal: "customer" });
    expect(options.path).toBe("/socket.io");
    expect(options.query).toBeUndefined();
    act(() => state.handlers.connect());
    expect(state.invalidation).toHaveBeenCalledWith({ queryKey: ["customer-notifications"] });
    state.invalidation.mockClear();
    act(() => state.handlers["notifications:changed"]());
    expect(state.invalidation).toHaveBeenCalledWith({ queryKey: ["customer-notifications"] });
    view.unmount();
    expect(state.remove).toHaveBeenCalled(); expect(state.disconnect).toHaveBeenCalled();
  });
  it("reconnects when the access token rotates and disconnects after logout", () => {
    const view = renderHook(() => useNotificationRealtime());
    state.token = "token-two";
    act(() => vi.advanceTimersByTime(5000));
    expect(state.connect).toHaveBeenCalledTimes(2);
    const auth = vi.fn(); state.io.mock.calls[0][1].auth(auth);
    expect(auth).toHaveBeenCalledWith({ token: "token-two", portal: "customer" });
    state.token = null;
    act(() => vi.advanceTimersByTime(5000));
    expect(state.connect).toHaveBeenCalledTimes(2); expect(state.disconnect).toHaveBeenCalledTimes(3);
    view.unmount();
  });
  it("opens no socket without an active tenant", () => {
    state.scope = "";
    const view = renderHook(() => useNotificationRealtime());
    expect(state.io).not.toHaveBeenCalled(); view.unmount();
  });
});
