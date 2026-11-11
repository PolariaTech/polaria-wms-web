/** Geocodificación OpenStreetMap Nominatim (REQ-251). */

export type GeocodeHit = {
  lat: number;
  lng: number;
  displayName: string;
};

const USER_AGENT = "PolariaWMS/1.0 (REQ-251 entrega mapa)";

export async function buscarDireccionNominatim(
  query: string,
  signal?: AbortSignal,
): Promise<GeocodeHit[]> {
  const q = query.trim();
  if (q.length < 3) return [];

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("q", q);
  url.searchParams.set("limit", "5");
  url.searchParams.set("addressdetails", "0");
  // Sesgo México (WMS hotelero); no excluye resultados fuera si no hay match local.
  url.searchParams.set("countrycodes", "mx");

  const res = await fetch(url.toString(), {
    signal,
    headers: {
      Accept: "application/json",
      // En browser el UA lo pone el navegador; en Node/tests sí aplica.
      "User-Agent": USER_AGENT,
    },
  });
  if (!res.ok) {
    throw new Error(`No se pudo buscar la dirección (${res.status}).`);
  }
  const data = (await res.json()) as Array<{
    lat?: string;
    lon?: string;
    display_name?: string;
  }>;
  return data
    .map((row) => {
      const lat = Number(row.lat);
      const lng = Number(row.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return {
        lat,
        lng,
        displayName: (row.display_name ?? "").trim() || q,
      };
    })
    .filter((row): row is GeocodeHit => row !== null);
}

export async function reverseGeocodeNominatim(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<string> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "json");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));

  const res = await fetch(url.toString(), {
    signal,
    headers: { Accept: "application/json", "User-Agent": USER_AGENT },
  });
  if (!res.ok) {
    throw new Error(`No se pudo obtener la dirección (${res.status}).`);
  }
  const data = (await res.json()) as { display_name?: string };
  return (data.display_name ?? "").trim();
}
