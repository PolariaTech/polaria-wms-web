import {
  requireCodigoCuenta,
  runDomainMutation,
} from "@/lib/supabase/domain-query";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import {
  generateCodigoCuentaFromNombre,
  normalizeCodigoCuentaInput,
} from "@/lib/utils/generate-codigo-cuenta";
import { mapCamionRow } from "./camiones.map";
import {
  CAMION_LIST_COLUMNS,
  type CamionDbRow,
  type CamionListRow,
  type CreateCamionInput,
  type DeactivateCamionParams,
  type UpdateCamionInput,
} from "./camiones.types";

function parseOptionalPositiveNumber(
  value: number | null | undefined,
  label: string,
): number | null {
  if (value === null || value === undefined) return null;
  if (!Number.isFinite(value) || value <= 0) {
    throw new DomainServiceError(
      `${label} debe ser un número mayor a cero.`,
      "INVALID_ARGUMENT",
    );
  }

  return value;
}

function parseOptionalPositiveInteger(
  value: number | null | undefined,
  label: string,
): number | null {
  if (value === null || value === undefined) return null;
  if (!Number.isInteger(value) || value <= 0) {
    throw new DomainServiceError(
      `${label} debe ser un entero mayor a cero.`,
      "INVALID_ARGUMENT",
    );
  }

  return value;
}

/** Crea un camión para la cuenta activa (scope tenant). */
export async function createCamionAdmin(
  input: CreateCamionInput,
): Promise<CamionListRow> {
  const codigoCuenta = requireCodigoCuenta(input.codigoCuenta);
  const placa = input.placa.trim().toUpperCase();
  const marca = input.marca?.trim() ?? "";
  const modelo = input.modelo?.trim() ?? "";
  const rangoTemperatura = input.rangoTemperatura?.trim() ?? "";
  const codigo = normalizeCodigoCuentaInput(
    generateCodigoCuentaFromNombre(placa),
  );

  if (!placa) {
    throw new DomainServiceError("La placa es obligatoria.", "INVALID_ARGUMENT");
  }

  if (!codigo) {
    throw new DomainServiceError(
      "No se pudo generar el código del camión.",
      "INVALID_ARGUMENT",
    );
  }

  const capacidadKg = parseOptionalPositiveNumber(
    input.capacidadKg,
    "El peso máximo",
  );
  const capacidadM3 = parseOptionalPositiveNumber(
    input.capacidadM3,
    "El volumen",
  );
  const capacidadPallets = parseOptionalPositiveInteger(
    input.capacidadPallets,
    "La capacidad de pallets",
  );

  const inserted = await runDomainMutation<CamionDbRow | null>((client) => {
    const query = client
      .from("camion")
      .insert({
        codigo_cuenta: codigoCuenta,
        codigo,
        placa,
        marca: marca || null,
        modelo: modelo || null,
        capacidad_kg: capacidadKg,
        capacidad_m3: capacidadM3,
        capacidad_pallets: capacidadPallets,
        tipo: input.tipo,
        rango_temperatura: rangoTemperatura || null,
        disponible: true,
        esta_activo: true,
      })
      .select(CAMION_LIST_COLUMNS)
      .single();

    return query as unknown as Promise<{
      data: CamionDbRow | null;
      error: { message: string } | null;
    }>;
  });

  if (!inserted) {
    throw new DomainServiceError(
      "No se pudo crear el camión.",
      "MUTATION_FAILED",
    );
  }

  return mapCamionRow(inserted);
}

/** Actualiza un camión de la cuenta activa (scope tenant). */
export async function updateCamionAdmin(
  input: UpdateCamionInput,
): Promise<CamionListRow> {
  const codigoCuenta = requireCodigoCuenta(input.codigoCuenta);
  const idCamion = input.idCamion.trim();
  const placa = input.placa.trim().toUpperCase();
  const marca = input.marca?.trim() ?? "";
  const modelo = input.modelo?.trim() ?? "";
  const rangoTemperatura = input.rangoTemperatura?.trim() ?? "";

  if (!idCamion) {
    throw new DomainServiceError(
      "Falta el identificador del camión.",
      "INVALID_ARGUMENT",
    );
  }

  if (!placa) {
    throw new DomainServiceError("La placa es obligatoria.", "INVALID_ARGUMENT");
  }

  const capacidadKg = parseOptionalPositiveNumber(
    input.capacidadKg,
    "El peso máximo",
  );
  const capacidadM3 = parseOptionalPositiveNumber(
    input.capacidadM3,
    "El volumen",
  );
  const capacidadPallets = parseOptionalPositiveInteger(
    input.capacidadPallets,
    "La capacidad de pallets",
  );

  const updated = await runDomainMutation<CamionDbRow | null>((client) => {
    const query = client
      .from("camion")
      .update({
        placa,
        marca: marca || null,
        modelo: modelo || null,
        capacidad_kg: capacidadKg,
        capacidad_m3: capacidadM3,
        capacidad_pallets: capacidadPallets,
        tipo: input.tipo,
        rango_temperatura: rangoTemperatura || null,
        ...(typeof input.disponible === "boolean"
          ? { disponible: input.disponible }
          : {}),
      })
      .eq("id_camion", idCamion)
      .eq("codigo_cuenta", codigoCuenta)
      .select(CAMION_LIST_COLUMNS)
      .single();

    return query as unknown as Promise<{
      data: CamionDbRow | null;
      error: { message: string } | null;
    }>;
  });

  if (!updated) {
    throw new DomainServiceError(
      "No se pudo actualizar el camión.",
      "MUTATION_FAILED",
    );
  }

  return mapCamionRow(updated);
}

/** Deshabilita un camión (baja lógica). */
export async function deactivateCamionAdmin(
  params: DeactivateCamionParams,
): Promise<void> {
  const codigoCuenta = requireCodigoCuenta(params.codigoCuenta);
  const idCamion = params.idCamion.trim();

  if (!idCamion) {
    throw new DomainServiceError(
      "Falta el identificador del camión.",
      "INVALID_ARGUMENT",
    );
  }

  await runDomainMutation((client) => {
    const query = client
      .from("camion")
      .update({ esta_activo: false })
      .eq("codigo_cuenta", codigoCuenta)
      .eq("id_camion", idCamion);

    return query as unknown as Promise<{
      data: unknown;
      error: { message: string } | null;
    }>;
  });
}

/** Reactiva un camión deshabilitado. */
export async function activateCamionAdmin(
  params: DeactivateCamionParams,
): Promise<void> {
  const codigoCuenta = requireCodigoCuenta(params.codigoCuenta);
  const idCamion = params.idCamion.trim();

  if (!idCamion) {
    throw new DomainServiceError(
      "Falta el identificador del camión.",
      "INVALID_ARGUMENT",
    );
  }

  await runDomainMutation((client) => {
    const query = client
      .from("camion")
      .update({ esta_activo: true })
      .eq("codigo_cuenta", codigoCuenta)
      .eq("id_camion", idCamion);

    return query as unknown as Promise<{
      data: unknown;
      error: { message: string } | null;
    }>;
  });
}