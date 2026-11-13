/**
 * Limpia Cache Storage / service workers y recarga con cache-bust
 * para tomar el bundle nuevo de producción (REQ-293).
 */
export async function reloadWithCacheClear(
  locationLike: Pick<Location, "href" | "replace"> = window.location,
  cachesApi: CacheStorage | undefined = globalThis.caches,
  serviceWorkerContainer: ServiceWorkerContainer | undefined =
    typeof navigator !== "undefined" ? navigator.serviceWorker : undefined,
): Promise<void> {
  try {
    if (cachesApi) {
      const keys = await cachesApi.keys();
      await Promise.all(keys.map((key) => cachesApi.delete(key)));
    }
  } catch {
    // Si Cache API falla, igual recargamos.
  }

  try {
    if (serviceWorkerContainer?.getRegistrations) {
      const registrations = await serviceWorkerContainer.getRegistrations();
      await Promise.all(
        registrations.map((registration) => registration.unregister()),
      );
    }
  } catch {
    // Sin SW o sin permiso: seguimos con la recarga.
  }

  const nextUrl = new URL(locationLike.href);
  nextUrl.searchParams.set("_pv", String(Date.now()));
  locationLike.replace(nextUrl.toString());
}
