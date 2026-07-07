const CHANNEL_NAME = "polaria-auth-channel";

let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
  if (typeof window === "undefined" || !("BroadcastChannel" in window)) {
    return null;
  }

  if (!channel) {
    channel = new BroadcastChannel(CHANNEL_NAME);
  }

  return channel;
}

/** Notifica a otras pestañas que el estado de auth cambió. */
export function notifyAuthChanged(): void {
  getChannel()?.postMessage({ type: "auth-changed", ts: Date.now() });
}

export function subscribeAuthChanged(listener: () => void): () => void {
  const bc = getChannel();
  if (!bc) return () => undefined;

  const handler = () => listener();
  bc.addEventListener("message", handler);
  return () => bc.removeEventListener("message", handler);
}
