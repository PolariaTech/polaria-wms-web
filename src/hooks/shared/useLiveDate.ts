"use client";

import { useEffect, useState } from "react";

export function formatDisplayDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

export function formatIsoDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${year}-${month}-${day}`;
}

const UPDATE_INTERVAL_MS = 60_000;

/** Fecha actual del sistema, actualizada en tiempo real. */
export function useLiveDate() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const update = () => setNow(new Date());
    const intervalId = window.setInterval(update, UPDATE_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, []);

  return {
    label: formatDisplayDate(now),
    dateTime: formatIsoDate(now),
  };
}
