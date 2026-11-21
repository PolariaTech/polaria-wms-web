"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { PolariaFormField, PolariaFormInput } from "@/components/shared/form/PolariaFormField";
import type { EmpresaFichaCampos } from "../domain/empresa-ficha-fiscal";

interface EmpresaFichaFieldsProps {
  idPrefix: string;
  valores: EmpresaFichaCampos;
  disabled: boolean;
  logoNombreActual: string | null;
  vistaPrevia: string | null;
  onChange: (campo: keyof EmpresaFichaCampos, valor: string) => void;
  onLogo: (archivo: File | null) => void;
  onQuitarLogo: () => void;
}

function soloDigitos(valor: string, maximo: number): string {
  return valor.replace(/\D/g, "").slice(0, maximo);
}

function CamposFiscales({
  idPrefix,
  valores,
  disabled,
  onChange,
}: Pick<
  EmpresaFichaFieldsProps,
  "idPrefix" | "valores" | "disabled" | "onChange"
>) {
  return (
    <>
      <PolariaFormInput
        id={`${idPrefix}-rfc`}
        label="RFC"
        value={valores.rfc}
        disabled={disabled}
        onChange={(event) => onChange("rfc", event.target.value)}
      />
      <PolariaFormInput
        id={`${idPrefix}-regimen`}
        label="Régimen fiscal"
        value={valores.regimenFiscal}
        inputMode="numeric"
        maxLength={3}
        disabled={disabled}
        onChange={(event) =>
          onChange("regimenFiscal", soloDigitos(event.target.value, 3))
        }
      />
      <PolariaFormInput
        id={`${idPrefix}-cp`}
        label="Código postal de expedición"
        value={valores.codigoPostalExpedicion}
        disabled={disabled}
        onChange={(event) =>
          onChange("codigoPostalExpedicion", event.target.value)
        }
      />
      <PolariaFormInput
        id={`${idPrefix}-cuenta`}
        label="Nombre de la cuenta"
        value={valores.nombreCuentaBancaria}
        disabled={disabled}
        onChange={(event) =>
          onChange("nombreCuentaBancaria", event.target.value)
        }
      />
    </>
  );
}

function CamposBanco({
  idPrefix,
  valores,
  disabled,
  onChange,
}: Pick<
  EmpresaFichaFieldsProps,
  "idPrefix" | "valores" | "disabled" | "onChange"
>) {
  return (
    <>
      <PolariaFormInput
        id={`${idPrefix}-banco`}
        label="Banco"
        value={valores.banco}
        disabled={disabled}
        onChange={(event) => onChange("banco", event.target.value)}
      />
      <PolariaFormInput
        id={`${idPrefix}-clabe`}
        label="CLABE"
        value={valores.clabe}
        disabled={disabled}
        onChange={(event) => onChange("clabe", event.target.value)}
      />
      <PolariaFormInput
        id={`${idPrefix}-correo`}
        label="Correo de cobranza"
        type="email"
        value={valores.correoCobranza}
        disabled={disabled}
        onChange={(event) => onChange("correoCobranza", event.target.value.replace(/ /g, ""))}
      />
      <PolariaFormInput
        id={`${idPrefix}-serie`}
        label="Serie"
        value={valores.serieFactura}
        disabled={disabled}
        onChange={(event) => onChange("serieFactura", event.target.value)}
      />
    </>
  );
}

function urlLogoGuardado(ruta: string | null): string | null {
  if (!ruta) return null;
  return `/api/empresa-logo?path=${encodeURIComponent(ruta)}`;
}

function MarcoLogo({ src }: { src: string | null }) {
  const [fallo, setFallo] = useState(false);

  useEffect(() => {
    setFallo(false);
  }, [src]);

  const visible = Boolean(src) && !fallo;

  return (
    <div className="polaria-card-glow flex h-72 items-center justify-center overflow-hidden rounded-2xl border border-polaria-t-20 bg-polaria-bg">
      {visible ? (
        <Image
          src={src ?? ""}
          alt="Logo"
          width={512}
          height={256}
          unoptimized
          className="max-h-64 w-full object-contain p-6"
          onError={() => setFallo(true)}
        />
      ) : (
        <p className="polaria-text-body text-polaria-w-50">
          {src ? "No se pudo mostrar el logo" : "Sin logo"}
        </p>
      )}
    </div>
  );
}

function CampoLogo({
  idPrefix,
  disabled,
  logoNombreActual,
  vistaPrevia,
  onLogo,
  onQuitarLogo,
}: Pick<
  EmpresaFichaFieldsProps,
  | "idPrefix"
  | "disabled"
  | "logoNombreActual"
  | "vistaPrevia"
  | "onLogo"
  | "onQuitarLogo"
>) {
  const src = vistaPrevia ?? urlLogoGuardado(logoNombreActual);

  return (
    <PolariaFormField id={`${idPrefix}-logo`} label="Logo">
      <MarcoLogo src={src} />
      <input
        id={`${idPrefix}-logo`}
        type="file"
        accept="image/jpeg,image/png"
        disabled={disabled}
        className="w-full text-sm text-polaria-w file:mr-3 file:rounded-lg file:border-0 file:bg-polaria-teal file:px-3 file:py-2 file:font-semibold file:text-polaria-on-teal"
        onChange={(event) => onLogo(event.target.files?.[0] ?? null)}
      />
      {logoNombreActual ? (
        <button
          type="button"
          className="text-sm text-polaria-teal"
          disabled={disabled}
          onClick={onQuitarLogo}
        >
          Quitar logo
        </button>
      ) : null}
    </PolariaFormField>
  );
}

export function EmpresaFichaFields(props: EmpresaFichaFieldsProps) {
  return (
    <div className="flex flex-col gap-4">
      <CamposFiscales {...props} />
      <CamposBanco {...props} />
      <CampoLogo {...props} />
    </div>
  );
}
