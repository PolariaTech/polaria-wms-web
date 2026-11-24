import { runDomainMutation } from "@/lib/supabase/domain-query";
import { resolveNombresCuentaAcrossSchemas } from "@/lib/supabase/tenant-fanout";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { type CreateImpresoraInput, type ImpresoraListRow } from "./impresoras.service.types";
import {
  IMPRESORA_CREATE_COLUMNS,
  type ImpresoraDbRow,
  mapListRow,
  validateCreateInput,
} from "./impresoras.service.shared";
import {
  assertCuentaSinImpresoraActiva,
  resolveUsuarioNombres,
} from "./impresoras.service.queries";

/** Crea una impresora carta desde el configurador. */
export async function createImpresoraConfigurator(
  input: CreateImpresoraInput,
): Promise<ImpresoraListRow> {
  const validated = validateCreateInput(input);

  // Alta desde configurador = nivel cuenta (todos los usuarios).
  if (!validated.idUsuario) {
    await assertCuentaSinImpresoraActiva({
      codigoCuenta: validated.codigoCuenta,
    });
  }

  const inserted = await runDomainMutation<ImpresoraDbRow | null>((client) => {
    const query = client
      .from("impresora")
      .insert({
        codigo_cuenta: validated.codigoCuenta,
        id_usuario: validated.idUsuario,
        id_bodega: validated.idBodega,
        nombre: validated.nombre,
        codigo: validated.codigo,
        marca: validated.marca,
        modelo: validated.modelo,
        pais: input.pais,
        ubicacion_texto: validated.ubicacionTexto,
        tipo_conexion: input.tipoConexion,
        modo_envio: input.modoEnvio,
        host_ip: validated.hostIp,
        puerto: validated.puerto,
        cola_nombre: validated.colaNombre,
        nombre_sistema: validated.nombreSistema,
        id_agente: validated.idAgente,
        email_destino: validated.emailDestino,
        usa_tls: validated.usaTls,
        tamano_papel: validated.tamanoPapel,
        orientacion: validated.orientacion,
        duplex: validated.duplex,
        color_modo: validated.colorModo,
        bandeja: validated.bandeja,
        copias_default: validated.copiasDefault,
        notas: validated.notas,
        id_creador: input.idCreador ?? null,
        esta_activa: true,
      })
      .select(IMPRESORA_CREATE_COLUMNS)
      .single();

    return query as unknown as Promise<{
      data: ImpresoraDbRow | null;
      error: { message: string } | null;
    }>;
  });

  if (!inserted) {
    throw new DomainServiceError(
      "No se pudo crear la impresora.",
      "MUTATION_FAILED",
    );
  }

  const nombres = await resolveNombresCuentaAcrossSchemas([
    inserted.codigo_cuenta,
  ]);
  const usuarioNombres = inserted.id_usuario
    ? await resolveUsuarioNombres([inserted.id_usuario])
    : new Map<string, string>();

  return mapListRow(
    inserted,
    nombres.get(inserted.codigo_cuenta) ?? inserted.codigo_cuenta,
    inserted.id_usuario
      ? (usuarioNombres.get(inserted.id_usuario) ?? null)
      : "Toda la cuenta",
  );
}

export type UpdateImpresoraInput = CreateImpresoraInput & {
  idImpresora: string;
  estaActiva?: boolean;
};

/** Actualiza una impresora existente del configurador. */
export async function updateImpresoraConfigurator(
  input: UpdateImpresoraInput,
): Promise<ImpresoraListRow> {
  const idImpresora = input.idImpresora.trim();
  if (!idImpresora) {
    throw new DomainServiceError(
      "Falta el id de la impresora.",
      "INVALID_ARGUMENT",
    );
  }

  const validated = validateCreateInput(input);
  const estaActiva = input.estaActiva ?? true;

  if (estaActiva) {
    await assertCuentaSinImpresoraActiva({
      codigoCuenta: validated.codigoCuenta,
      excludeIdImpresora: idImpresora,
    });
  }

  const updated = await runDomainMutation<ImpresoraDbRow | null>((client) => {
    const query = client
      .from("impresora")
      .update({
        codigo_cuenta: validated.codigoCuenta,
        id_usuario: null,
        id_bodega: validated.idBodega,
        nombre: validated.nombre,
        codigo: validated.codigo,
        marca: validated.marca,
        modelo: validated.modelo,
        pais: input.pais,
        ubicacion_texto: validated.ubicacionTexto,
        tipo_conexion: input.tipoConexion,
        modo_envio: input.modoEnvio,
        host_ip: validated.hostIp,
        puerto: validated.puerto,
        cola_nombre: validated.colaNombre,
        nombre_sistema: validated.nombreSistema,
        id_agente: validated.idAgente,
        email_destino: validated.emailDestino,
        usa_tls: validated.usaTls,
        tamano_papel: validated.tamanoPapel,
        orientacion: validated.orientacion,
        duplex: validated.duplex,
        color_modo: validated.colorModo,
        bandeja: validated.bandeja,
        copias_default: validated.copiasDefault,
        notas: validated.notas,
        esta_activa: estaActiva,
        updated_at: new Date().toISOString(),
      })
      .eq("id_impresora", idImpresora)
      .select(IMPRESORA_CREATE_COLUMNS)
      .single();

    return query as unknown as Promise<{
      data: ImpresoraDbRow | null;
      error: { message: string } | null;
    }>;
  });

  if (!updated) {
    throw new DomainServiceError(
      "No se pudo actualizar la impresora.",
      "MUTATION_FAILED",
    );
  }

  const nombres = await resolveNombresCuentaAcrossSchemas([
    updated.codigo_cuenta,
  ]);

  return mapListRow(
    updated,
    nombres.get(updated.codigo_cuenta) ?? updated.codigo_cuenta,
    "Toda la cuenta",
  );
}

/** Elimina la impresora de la cuenta (permite configurar otra después). */
export async function deleteImpresoraConfigurator(
  idImpresora: string,
): Promise<void> {
  const id = idImpresora.trim();
  if (!id) {
    throw new DomainServiceError(
      "Falta el id de la impresora.",
      "INVALID_ARGUMENT",
    );
  }

  await runDomainMutation<null>((client) => {
    const query = client.from("impresora").delete().eq("id_impresora", id);

    return query as unknown as Promise<{
      data: null;
      error: { message: string } | null;
    }>;
  });
}
