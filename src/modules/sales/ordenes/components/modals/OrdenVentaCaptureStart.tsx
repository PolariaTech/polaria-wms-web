"use client";

import { FileText, UserRound } from "lucide-react";
import type { DragEvent, RefObject } from "react";
import { JefeBodegaModalSearchField } from "@/modules/jefe-bodega/components/modals/jefe-bodega-modal-ui";
import { POLARIA_FORM_INPUT_CLASS_COMPACT } from "@/components/shared/form/PolariaFormField";
import { NoIdentificadoBadge } from "../shared/NoIdentificadoBadge";
import { cn } from "@/lib/utils/cn";
import { CaptureDocsArchivos } from "./CaptureSection";
import type { StartMode } from "../../types/orden-venta-create-modal.types";

function StartChoices({
  startMode,
  onFirstTime,
  onScratch,
  onDocs,
}: {
  startMode: StartMode | null;
  onFirstTime: () => void;
  onScratch: () => void;
  onDocs: () => void;
}) {
  const cardClass = cn(
    "relative flex size-[11rem] shrink-0 flex-col items-center justify-center rounded-2xl border px-4 py-4 text-center transition",
    "border-polaria-t-20 bg-polaria-t-08 hover:border-polaria-teal",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal",
  );
  return (
    <div className="flex flex-row flex-wrap justify-center gap-3">
      <button type="button" aria-pressed={startMode === "first_time"} onClick={onFirstTime} className={cardClass}>
        <p className="polaria-text-card-title text-base text-polaria-w">Registrar comprador</p>
      </button>
      <button type="button" aria-pressed={startMode === "scratch"} onClick={onScratch} className={cardClass}>
        <p className="polaria-text-card-title text-base text-polaria-w">Venta nueva</p>
      </button>
      <button type="button" aria-pressed={false} onClick={onDocs} className={cardClass}>
        <p className="polaria-text-card-title text-base text-polaria-w">Tengo el mensaje o archivos</p>
      </button>
    </div>
  );
}

function DocsCliente({
  compradorLabel,
  clienteControlClass,
  onSearchCliente,
  showClientePendiente,
}: {
  compradorLabel: string;
  clienteControlClass?: string;
  onSearchCliente: () => void;
  showClientePendiente: boolean;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-polaria-t-20 bg-polaria-t-08">
      <div className="flex items-center gap-2 border-b border-polaria-w-08 px-4 py-2.5">
        <UserRound className="h-4 w-4 shrink-0 text-polaria-teal" aria-hidden />
        <h3 className="polaria-text-label uppercase tracking-wide text-polaria-teal">Cliente</h3>
        <span className="rounded-md border border-polaria-t-20 bg-polaria-bg/40 px-1.5 py-0.5 polaria-text-caption text-polaria-w-50">
          opcional
        </span>
      </div>
      <div className="space-y-2 p-4">
        <JefeBodegaModalSearchField
          id="orden-venta-docs-cliente"
          value={compradorLabel}
          placeholder="Selecciona el cliente (opcional)"
          ariaLabel="Cliente"
          compact
          controlClassName={clienteControlClass}
          onSearchClick={onSearchCliente}
        />
        <p className="polaria-text-caption text-polaria-w-50">
          Si el archivo trae el comprador y está en catálogo, Mateo lo asigna solo. Si no, lo eliges después.
        </p>
        {showClientePendiente ? (
          <div className="flex flex-wrap items-center gap-2">
            <NoIdentificadoBadge />
            <button
              type="button"
              onClick={onSearchCliente}
              className="rounded-lg border border-polaria-teal px-2 py-1 polaria-text-caption font-semibold text-polaria-teal transition hover:bg-polaria-t-08"
            >
              Elegir cliente
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function DocsMensaje({
  origenTexto,
  onOrigenTexto,
}: {
  origenTexto: string;
  onOrigenTexto: (value: string) => void;
}) {
  return (
    <section className="flex min-h-[16rem] flex-col overflow-hidden rounded-2xl border border-polaria-t-20 bg-polaria-t-08">
      <div className="flex items-center justify-between gap-2 border-b border-polaria-w-08 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 shrink-0 text-polaria-teal" aria-hidden />
          <h3 className="polaria-text-label uppercase tracking-wide text-polaria-teal">Mensaje</h3>
        </div>
        {origenTexto.trim() ? (
          <span className="rounded-md border border-polaria-t-20 bg-polaria-bg/50 px-1.5 py-0.5 polaria-text-caption font-semibold text-polaria-teal">
            listo
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <textarea
          id="orden-venta-docs-texto"
          value={origenTexto}
          onChange={(event) => onOrigenTexto(event.target.value)}
          placeholder="Pega aquí el WhatsApp, correo o nota tal cual llegó. No lo resumas."
          className={cn(POLARIA_FORM_INPUT_CLASS_COMPACT, "min-h-[10rem] flex-1 resize-y")}
        />
        <p className="polaria-text-caption text-polaria-w-50">Texto crudo del cliente o del hotel.</p>
      </div>
    </section>
  );
}

export function OrdenVentaCaptureStart(props: {
  showChoices: boolean;
  showDocs: boolean;
  startMode: StartMode | null;
  isEditing: boolean;
  onFirstTime: () => void;
  onScratch: () => void;
  onDocs: () => void;
  onBack: () => void;
  compradorLabel: string;
  clienteControlClass?: string;
  onSearchCliente: () => void;
  showClientePendiente: boolean;
  origenTexto: string;
  onOrigenTexto: (value: string) => void;
  origenArchivoFiles: File[];
  isDocsDropActive: boolean;
  docsFileInputRef: RefObject<HTMLInputElement | null>;
  onDragOver: (event: DragEvent<HTMLLabelElement>) => void;
  onDragLeave: () => void;
  onDrop: (event: DragEvent<HTMLLabelElement>) => void;
  onFilesSelected: (files: FileList | File[]) => void;
  onRemoveFile: (file: File) => void;
  docsHasContent: boolean;
}) {
  return (
    <>
      {props.showChoices ? (
        <StartChoices
          startMode={props.startMode}
          onFirstTime={props.onFirstTime}
          onScratch={props.onScratch}
          onDocs={props.onDocs}
        />
      ) : null}
      {props.showDocs ? (
        <DocsPanel {...props} />
      ) : null}
    </>
  );
}

function DocsPanel(props: {
  isEditing: boolean;
  onBack: () => void;
  compradorLabel: string;
  clienteControlClass?: string;
  onSearchCliente: () => void;
  showClientePendiente: boolean;
  origenTexto: string;
  onOrigenTexto: (value: string) => void;
  origenArchivoFiles: File[];
  isDocsDropActive: boolean;
  docsFileInputRef: RefObject<HTMLInputElement | null>;
  onDragOver: (event: DragEvent<HTMLLabelElement>) => void;
  onDragLeave: () => void;
  onDrop: (event: DragEvent<HTMLLabelElement>) => void;
  onFilesSelected: (files: FileList | File[]) => void;
  onRemoveFile: (file: File) => void;
  docsHasContent: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      {!props.isEditing ? (
        <button
          type="button"
          onClick={props.onBack}
          className="self-start polaria-text-caption text-polaria-w-50 transition hover:text-polaria-teal"
        >
          ← Volver al inicio
        </button>
      ) : null}
      <DocsCliente
        compradorLabel={props.compradorLabel}
        clienteControlClass={props.clienteControlClass}
        onSearchCliente={props.onSearchCliente}
        showClientePendiente={props.showClientePendiente}
      />
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <DocsMensaje origenTexto={props.origenTexto} onOrigenTexto={props.onOrigenTexto} />
        <CaptureDocsArchivos
          files={props.origenArchivoFiles}
          isDropActive={props.isDocsDropActive}
          inputRef={props.docsFileInputRef}
          onDragOver={props.onDragOver}
          onDragLeave={props.onDragLeave}
          onDrop={props.onDrop}
          onFilesSelected={props.onFilesSelected}
          onRemoveFile={props.onRemoveFile}
        />
      </div>
      {props.docsHasContent ? (
        <p className="rounded-xl border border-polaria-t-20 bg-polaria-teal/10 px-3 py-2.5 polaria-text-caption text-polaria-teal">
          Listo para Continuar: Mateo va a leer lo que pegaste o adjuntaste.
        </p>
      ) : (
        <p className="rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-3 py-2.5 polaria-text-caption text-polaria-w-50">
          Agrega un mensaje o al menos un archivo para continuar.
        </p>
      )}
    </div>
  );
}
