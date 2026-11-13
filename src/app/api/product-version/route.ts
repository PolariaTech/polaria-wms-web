import { NextResponse } from "next/server";
import { POLARIA_PRODUCT_VERSION } from "@/constants/brand/brand";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Versión del deploy actual (REQ-293). Sin caché para que pestañas viejas
 * detecten el SemVer nuevo tras un despliegue.
 *
 * La fuente es `POLARIA_PRODUCT_VERSION` (alineada con `VERSION` / package.json
 * en el build). El bundle viejo del cliente conserva su constante; este
 * handler sirve la del deploy nuevo.
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { version: POLARIA_PRODUCT_VERSION },
    {
      headers: {
        "Cache-Control": "no-store, must-revalidate",
      },
    },
  );
}
