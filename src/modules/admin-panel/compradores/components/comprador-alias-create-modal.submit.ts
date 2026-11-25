import { parseDecimalEs } from "@/lib/utils/decimal-es";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import type { CatalogoProductoListRow } from "@/modules/admin-panel/catalogo/services/productos-catalogo.service";
import type { CompradorListRow } from "../services/compradores.service";
import { createCompradorProductoAliasAdmin } from "../services/comprador-producto-alias.service";
import {
  MENSAJE_COMPRADOR_NO_ENCONTRADO,
  MENSAJE_CUENTA_NO_ENCONTRADA,
  mensajeFraseLarga,
  mensajePrecioInvalido,
} from "../utils/comprador-alias-reglas";
import {
  isSamePrecio,
  type EquivalenciaCreateDraft,
} from "./comprador-alias-create-modal.helpers";

export async function submitCompradorAliasCreates(input: {
  codigoCuenta: string | null;
  comprador: CompradorListRow | null;
  pendingCreates: CatalogoProductoListRow[];
  drafts: Record<string, EquivalenciaCreateDraft>;
  precioByProductoId: Record<string, number>;
  precioEspecialPorProducto: ReadonlySet<string>;
  onCreated: () => void;
  onClose: () => void;
  setError: (message: string | null) => void;
  setIsSubmitting: (value: boolean) => void;
}): Promise<void> {
  const {
    codigoCuenta,
    comprador,
    pendingCreates,
    drafts,
    precioByProductoId,
    precioEspecialPorProducto,
    onCreated,
    onClose,
    setError,
    setIsSubmitting,
  } = input;

  setError(null);

  if (!codigoCuenta) {
    setError(MENSAJE_CUENTA_NO_ENCONTRADA);
    return;
  }

  if (!comprador) {
    setError(MENSAJE_COMPRADOR_NO_ENCONTRADO);
    return;
  }

  if (pendingCreates.length === 0) {
    setError("No hay cambios para guardar.");
    return;
  }

  const toSave: Array<{
    row: CatalogoProductoListRow;
    alias: string;
    precioParsed: number | null;
    precioChanged: boolean;
  }> = [];

  for (const row of pendingCreates) {
    const draft = drafts[row.idProducto];
    if (!draft) continue;

    const alias = draft.alias.trim();

    if (alias.length > 255) {
      setError(mensajeFraseLarga(row.codigo));
      return;
    }

    const precioChanged = !isSamePrecio(
      precioByProductoId[row.idProducto],
      draft.precioTexto,
    );
    let precioParsed: number | null = null;

    if (precioChanged) {
      const trimmed = draft.precioTexto.trim();
      if (trimmed === "") {
        precioParsed = null;
      } else {
        precioParsed = parseDecimalEs(trimmed);
        if (precioParsed == null || precioParsed < 0) {
          setError(mensajePrecioInvalido(row.codigo));
          return;
        }
      }
    }

    toSave.push({ row, alias, precioParsed, precioChanged });
  }

  const choquePrecio = toSave.find(
    (item) =>
      item.precioChanged &&
      item.precioParsed != null &&
      precioEspecialPorProducto.has(item.row.idProducto),
  );
  if (choquePrecio) {
    setError(
      `Este cliente ya tiene un precio especial para ${choquePrecio.row.titulo}. Cámbialo en la tabla de equivalencias.`,
    );
    return;
  }

  setIsSubmitting(true);

  try {
    for (const item of toSave) {
      const lista = precioByProductoId[item.row.idProducto];
      const precioOverride =
        !item.precioChanged || item.precioParsed == null
          ? null
          : lista != null && Math.abs(item.precioParsed - lista) < 1e-9
            ? null
            : item.precioParsed;

      await createCompradorProductoAliasAdmin({
        codigoCuenta,
        idComprador: comprador.idComprador,
        idProducto: item.row.idProducto,
        alias: item.alias,
        precio: precioOverride,
        codigoProducto: item.row.codigo,
      });
    }

    onCreated();
    onClose();
  } catch (err: unknown) {
    setError(
      err instanceof DomainServiceError
        ? err.message
        : "No se pudo guardar la equivalencia.",
    );
  } finally {
    setIsSubmitting(false);
  }
}