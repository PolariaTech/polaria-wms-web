"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  isEntregaCoordsValid,
  type EntregaCoords,
} from "../../utils/pedido/entrega-mapa-links";
import { buscarDireccionNominatim } from "../../utils/pedido/geocode-nominatim";

const DEFAULT_CENTER: EntregaCoords = { lat: 20.6296, lng: -87.0739 };
const DEFAULT_ZOOM = 13;

export type EntregaMapaHit = {
  lat: number;
  lng: number;
  displayName: string;
};

type UseEntregaMapaParams = {
  open: boolean;
  modo: "editar" | "ver";
  direccionInicial: string;
  latInicial?: number | null;
  lngInicial?: number | null;
};

/**
 * REQ-251: el texto del campo Dirección de entrega se conserva.
 * Clic/arrastre solo mueven el pin (lat/lng); no reescriben la dirección.
 * Al abrir sin coords, geocodifica ese texto y marca el pin.
 */
export function useEntregaMapa({
  open,
  modo,
  direccionInicial,
  latInicial,
  lngInicial,
}: UseEntregaMapaParams) {
  const mapHostRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markerRef = useRef<import("leaflet").Marker | null>(null);
  const LRef = useRef<typeof import("leaflet") | null>(null);

  const textoCampo = direccionInicial.trim();
  const coordsIniciales = isEntregaCoordsValid(latInicial, lngInicial)
    ? { lat: latInicial as number, lng: lngInicial as number }
    : null;

  const [query, setQuery] = useState(direccionInicial);
  const [hits, setHits] = useState<EntregaMapaHit[]>([]);
  const [coords, setCoords] = useState<EntregaCoords | null>(coordsIniciales);
  const [direccionResuelta, setDireccionResuelta] = useState(textoCampo);
  const [buscando, setBuscando] = useState(false);
  const [mapaListo, setMapaListo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setQuery(direccionInicial);
    setDireccionResuelta(textoCampo);
    setHits([]);
    setError(null);
    setCoords(coordsIniciales);
  }, [open, direccionInicial, textoCampo, latInicial, lngInicial]);

  const colocarMarcador = useCallback(
    (next: EntregaCoords) => {
      setCoords(next);
      const L = LRef.current;
      const map = mapRef.current;
      if (!L || !map) return;

      if (!markerRef.current) {
        markerRef.current = L.marker([next.lat, next.lng], {
          draggable: modo === "editar",
        }).addTo(map);
        if (modo === "editar") {
          markerRef.current.on("dragend", () => {
            const pos = markerRef.current?.getLatLng();
            if (!pos) return;
            // Solo mueve coords; no toca el texto de la dirección.
            colocarMarcador({ lat: pos.lat, lng: pos.lng });
          });
        }
      } else {
        markerRef.current.setLatLng([next.lat, next.lng]);
      }
      map.setView([next.lat, next.lng], Math.max(map.getZoom(), 15));
    },
    [modo],
  );

  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    let cancelled = false;

    async function montarMapa() {
      // El portal puede pintar un frame después; esperar el host evita mapa sin pin.
      let host = mapHostRef.current;
      for (let intento = 0; !host && intento < 10 && !cancelled; intento += 1) {
        await new Promise((r) => requestAnimationFrame(() => r(undefined)));
        host = mapHostRef.current;
      }
      if (!host || cancelled) return;
      const leaflet = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      if (cancelled) return;

      LRef.current = leaflet;
      const icon = leaflet.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });
      leaflet.Marker.prototype.options.icon = icon;

      const start = coordsIniciales ?? DEFAULT_CENTER;
      const map = leaflet
        .map(host)
        .setView([start.lat, start.lng], DEFAULT_ZOOM);
      leaflet
        .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        })
        .addTo(map);
      mapRef.current = map;
      setMapaListo(true);

      if (coordsIniciales) {
        colocarMarcador(coordsIniciales);
      } else if (modo === "editar" && textoCampo.length >= 3) {
        setBuscando(true);
        try {
          const found = await buscarDireccionNominatim(textoCampo);
          if (cancelled) return;
          setHits(found);
          if (found[0]) {
            // Pin según el texto; el texto del campo se conserva tal cual.
            colocarMarcador({ lat: found[0].lat, lng: found[0].lng });
          } else {
            setError(
              "No pude ubicar esa dirección en el mapa. Busca o haz clic para marcar el punto.",
            );
          }
        } catch (err) {
          if (!cancelled) {
            setError(
              err instanceof Error
                ? err.message
                : "No se pudo buscar la dirección en el mapa.",
            );
          }
        } finally {
          if (!cancelled) setBuscando(false);
        }
      }

      if (modo === "editar") {
        map.on("click", (event: { latlng: { lat: number; lng: number } }) => {
          // Ajusta solo el pin; no reescribe la dirección del campo/buscador.
          colocarMarcador({
            lat: event.latlng.lat,
            lng: event.latlng.lng,
          });
        });
      }
    }

    void montarMapa();
    return () => {
      cancelled = true;
      markerRef.current = null;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      setMapaListo(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- montaje por `open`
  }, [open]);

  async function buscar() {
    const q = query.trim();
    if (q.length < 3) {
      setError("Escribe al menos 3 caracteres para buscar.");
      return;
    }
    setBuscando(true);
    setError(null);
    try {
      const found = await buscarDireccionNominatim(q);
      setHits(found);
      if (!found[0]) {
        setError("No encontré esa dirección. Prueba con más detalle.");
        return;
      }
      // Búsqueda explícita: sí actualiza el texto a la sugerencia elegida.
      setDireccionResuelta(found[0].displayName);
      setQuery(found[0].displayName);
      colocarMarcador({ lat: found[0].lat, lng: found[0].lng });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo buscar la dirección.",
      );
    } finally {
      setBuscando(false);
    }
  }

  function elegirHit(hit: EntregaMapaHit) {
    setDireccionResuelta(hit.displayName);
    setQuery(hit.displayName);
    colocarMarcador({ lat: hit.lat, lng: hit.lng });
  }

  return {
    mapHostRef,
    query,
    setQuery,
    hits,
    coords,
    direccionResuelta,
    buscando,
    mapaListo,
    error,
    setError,
    buscar,
    elegirHit,
  };
}
