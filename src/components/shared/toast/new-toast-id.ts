/** Id de toast estable en contextos sin `crypto.randomUUID` (HTTP local, etc.). */
export function newToastId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
