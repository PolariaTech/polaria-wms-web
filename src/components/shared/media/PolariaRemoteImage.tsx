"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils/cn";

type PolariaRemoteImageProps = {
  src: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
  /** Ancho intrínseco para layout de next/image (no fuerza CSS si hay className). */
  width?: number;
  height?: number;
  draggable?: boolean;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
};

/**
 * Imagen remota (Cloudinary, blob, data) vía next/image.
 * `unoptimized`: URLs dinámicas/externas sin domain allowlist completa.
 */
export function PolariaRemoteImage({
  src,
  alt,
  className,
  style,
  width = 800,
  height = 600,
  draggable,
  fill = false,
  sizes,
  priority,
}: PolariaRemoteImageProps) {
  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes ?? "100vw"}
        unoptimized
        priority={priority}
        draggable={draggable}
        className={cn(className)}
        style={style}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      unoptimized
      priority={priority}
      draggable={draggable}
      className={cn(className)}
      style={style}
    />
  );
}
