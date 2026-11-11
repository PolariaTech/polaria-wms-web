/** Enlaces y helpers de ubicación de entrega (REQ-251). */

export type EntregaCoords = {
  lat: number;
  lng: number;
};

export function isEntregaCoordsValid(
  lat: number | null | undefined,
  lng: number | null | undefined,
): lat is number {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  );
}

export function urlGoogleMaps(coords: EntregaCoords, direccion?: string): string {
  const q = direccion?.trim()
    ? encodeURIComponent(direccion.trim())
    : `${coords.lat},${coords.lng}`;
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

export function urlWaze(coords: EntregaCoords): string {
  return `https://waze.com/ul?ll=${coords.lat}%2C${coords.lng}&navigate=yes`;
}

export function textoCoords(coords: EntregaCoords): string {
  return `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;
}
