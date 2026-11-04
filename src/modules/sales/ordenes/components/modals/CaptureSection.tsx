"use client";

import { FileText, Paperclip, Upload, X } from "lucide-react";
import type { DragEvent, ReactNode, RefObject } from "react";
import { cn } from "@/lib/utils/cn";

export function CaptureSection({
  title,
  optional,
  children,
  footer,
}: {
  title: string;
  optional?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-polaria-t-20 bg-polaria-t-08">
      <h3 className="flex items-center justify-between gap-3 border-b border-polaria-w-08 px-4 py-2.5 polaria-text-label uppercase tracking-wide text-polaria-teal">
        <span>{title}</span>
        {optional ? (
          <span className="normal-case tracking-normal text-polaria-w-50">
            {optional}
          </span>
        ) : null}
      </h3>
      <div className="p-4">{children}</div>
      {footer}
    </section>
  );
}

export function CaptureDocsArchivos({
  files,
  isDropActive,
  inputRef,
  onDragOver,
  onDragLeave,
  onDrop,
  onFilesSelected,
  onRemoveFile,
}: {
  files: File[];
  isDropActive: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  onDragOver: (event: DragEvent<HTMLLabelElement>) => void;
  onDragLeave: () => void;
  onDrop: (event: DragEvent<HTMLLabelElement>) => void;
  onFilesSelected: (files: FileList | File[]) => void;
  onRemoveFile: (file: File) => void;
}) {
  return (
    <section className="flex min-h-[16rem] flex-col overflow-hidden rounded-2xl border border-polaria-t-20 bg-polaria-t-08">
      <DocsArchivosHeader count={files.length} />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <DocsDropZone
          isDropActive={isDropActive}
          inputRef={inputRef}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onFilesSelected={onFilesSelected}
        />
        <DocsFileList files={files} onRemoveFile={onRemoveFile} />
      </div>
    </section>
  );
}

function DocsArchivosHeader({ count }: { count: number }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-polaria-w-08 px-4 py-2.5">
      <div className="flex items-center gap-2">
        <Paperclip className="h-4 w-4 shrink-0 text-polaria-teal" aria-hidden />
        <h3 className="polaria-text-label uppercase tracking-wide text-polaria-teal">Archivos</h3>
      </div>
      {count > 0 ? (
        <span className="rounded-md border border-polaria-t-20 bg-polaria-bg/50 px-1.5 py-0.5 polaria-text-caption font-semibold text-polaria-teal">
          {count} adjunto{count === 1 ? "" : "s"}
        </span>
      ) : null}
    </div>
  );
}

function DocsDropZone({
  isDropActive,
  inputRef,
  onDragOver,
  onDragLeave,
  onDrop,
  onFilesSelected,
}: {
  isDropActive: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  onDragOver: (event: DragEvent<HTMLLabelElement>) => void;
  onDragLeave: () => void;
  onDrop: (event: DragEvent<HTMLLabelElement>) => void;
  onFilesSelected: (files: FileList | File[]) => void;
}) {
  return (
    <label
      htmlFor="orden-venta-docs-archivos"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        "flex flex-1 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-6 text-center transition",
        isDropActive
          ? "border-polaria-teal bg-polaria-teal/10 text-polaria-teal polaria-card-glow"
          : "border-polaria-t-20 bg-polaria-bg/35 text-polaria-w-50 hover:border-polaria-teal hover:bg-polaria-t-08 hover:text-polaria-teal",
      )}
    >
      <span
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-full border",
          isDropActive
            ? "border-polaria-teal bg-polaria-teal/15 text-polaria-teal"
            : "border-polaria-t-20 bg-polaria-t-08 text-polaria-teal",
        )}
      >
        <Upload className="h-5 w-5" aria-hidden />
      </span>
      <span className="polaria-text-body-sm font-semibold text-polaria-w">
        {isDropActive ? "Suelta los archivos aquí" : "Arrastra o selecciona"}
      </span>
      <span className="max-w-[16rem] polaria-text-caption text-polaria-w-50">
        PDF, Excel, CSV, Word, correos (.eml) y fotos
      </span>
      <input
        id="orden-venta-docs-archivos"
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.xlsx,.xls,.csv,.txt,.docx,.eml,.html,.htm,image/*"
        className="sr-only"
        onChange={(event) => {
          onFilesSelected(event.target.files ?? []);
          event.target.value = "";
        }}
      />
    </label>
  );
}

function DocsFileList({
  files,
  onRemoveFile,
}: {
  files: File[];
  onRemoveFile: (file: File) => void;
}) {
  if (files.length === 0) {
    return (
      <p className="polaria-text-caption text-polaria-w-50">
        Otros formatos se guardan como respaldo sin leerse.
      </p>
    );
  }
  return (
    <ul className="space-y-1.5">
      {files.map((file) => (
        <li
          key={`${file.name}-${file.size}`}
          className="flex items-center gap-2 rounded-xl border border-polaria-t-20 bg-polaria-bg/45 px-2.5 py-2"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-polaria-t-20 bg-polaria-t-08 text-polaria-teal">
            <FileText className="h-3.5 w-3.5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1 truncate polaria-text-caption font-medium text-polaria-w">
            {file.name}
          </span>
          <button
            type="button"
            aria-label={`Quitar ${file.name}`}
            onClick={() => onRemoveFile(file)}
            className="rounded-md p-1 text-polaria-w-50 transition hover:bg-polaria-w-08 hover:text-polaria-danger"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
        </li>
      ))}
    </ul>
  );
}

