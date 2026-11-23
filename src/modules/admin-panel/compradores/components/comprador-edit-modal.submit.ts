import { isValidInternationalPhone } from "@/constants/ui/phone-countries";
import { parseDecimalEs } from "@/lib/utils/decimal-es";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import {
  updateCompradorAdmin,
  type CompradorListRow,
} from "../services/compradores.service";
import {
  updateCompradorProductoAliasAdmin,
  type CompradorProductoAliasListRow,
} from "../services/comprador-producto-alias.service";
import {
  fichaFromAltaForm,
  type CompradorAltaFormState,
} from "../utils/comprador-alta";
import { isSamePrecio } from "./comprador-edit-modal.helpers";
import type { CompradorEquivalenciaDraft } from "./CompradorEquivalenciasTable";

export async function submitCompradorEditModal(input: {
  codigoCuenta: string | null;
  comprador: CompradorListRow | null;
  isDirty: boolean;
  isFormDirty: boolean;
  form: CompradorAltaFormState;
  equivalencias: CompradorProductoAliasListRow[];
  equivalenciaDrafts: Record<string, CompradorEquivalenciaDraft>;
  setError: (message: string | null) => void;
  setActiveTab: (tab: "informacion" | "equivalencia") => void;
  setIsSubmitting: (value: boolean) => void;
  onUpdated: () => void;
  onClose: () => void;
}): Promise<void> {
  const {
    codigoCuenta,
    comprador,
    isDirty,
    isFormDirty,
    form,
    equivalencias,
    equivalenciaDrafts,
    setError,
    setActiveTab,
    setIsSubmitting,
    onUpdated,
    onClose,
  } = input;

  if (!comprador || !isDirty) return;

  setError(null);

  if (!codigoCuenta) {
    setError("No se encontró la cuenta activa.");
    return;
  }

  if (isFormDirty) {
    const ficha = fichaFromAltaForm(form);
    const nombre = form.nombreComercial.trim() || ficha.razonSocial.trim();
    if (!nombre) {
      setError("Falta el nombre comercial.");
      setActiveTab("informacion");
      return;
    }

    const telefonoPrincipal = form.telefono.trim();

    if (telefonoPrincipal && !isValidInternationalPhone(telefonoPrincipal)) {
      setError("Ingresa un número de teléfono válido.");
      setActiveTab("informacion");
      return;
    }
  }

  const equivalenciaChanges: Array<{
    row: CompradorProductoAliasListRow;
    draft: CompradorEquivalenciaDraft;
    aliasChanged: boolean;
    precioChanged: boolean;
    precioParsed: number | null;
  }> = [];

  for (const row of equivalencias) {
    const draft = equivalenciaDrafts[row.idAlias];
    if (!draft) continue;

    const aliasChanged = draft.alias.trim() !== row.alias.trim();
    const precioChanged = !isSamePrecio(row.precio, draft.precioTexto);

    if (!aliasChanged && !precioChanged) continue;

    let precioParsed: number | null = null;
    if (precioChanged) {
      const trimmed = draft.precioTexto.trim();
      if (trimmed === "") {
        precioParsed = null;
      } else {
        precioParsed = parseDecimalEs(trimmed);
        if (precioParsed == null || precioParsed < 0) {
          setError("Ingresa un precio válido (0 o mayor).");
          setActiveTab("equivalencia");
          return;
        }
      }
    }

    equivalenciaChanges.push({
      row,
      draft,
      aliasChanged,
      precioChanged,
      precioParsed,
    });
  }

  setIsSubmitting(true);

  try {
    if (isFormDirty) {
      const ficha = fichaFromAltaForm(form);
      const nombre = form.nombreComercial.trim() || ficha.razonSocial.trim();
      const telefonoPrincipal = form.telefono.trim();
      const telefonoContacto = ficha.contactos
        .map((row) => row.telefono.trim())
        .find((value) => value && isValidInternationalPhone(value));
      const telefonoGuardar = telefonoPrincipal || telefonoContacto || "";

      await updateCompradorAdmin({
        codigoCuenta,
        idComprador: comprador.idComprador,
        nombre,
        telefono: telefonoGuardar,
        ficha,
      });
    }

    for (const change of equivalenciaChanges) {
      let precioOverride: number | null | undefined;
      if (change.precioChanged) {
        if (
          change.precioParsed != null &&
          change.row.precioLista != null &&
          Math.abs(change.precioParsed - change.row.precioLista) < 1e-9
        ) {
          precioOverride = null;
        } else {
          precioOverride = change.precioParsed;
        }
      }

      await updateCompradorProductoAliasAdmin({
        codigoCuenta,
        idAlias: change.row.idAlias,
        ...(change.aliasChanged ? { alias: change.draft.alias.trim() } : {}),
        ...(change.precioChanged ? { precio: precioOverride ?? null } : {}),
      });
    }

    onUpdated();
    onClose();
  } catch (err: unknown) {
    setError(
      err instanceof DomainServiceError
        ? err.message
        : "No se pudo actualizar el cliente.",
    );
  } finally {
    setIsSubmitting(false);
  }
}