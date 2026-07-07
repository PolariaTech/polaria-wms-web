"use client";

import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type {
  PolariaRequestEndpointTone,
  PolariaRequestFlowCardProps,
  PolariaRequestFlowEndpoint,
  PolariaRequestMetadataItem,
} from "./polaria-request.types";

const ENDPOINT_TONE: Record<
  PolariaRequestEndpointTone,
  { box: string; label: string; icon: string }
> = {
  teal: {
    box: "border-polaria-t-20 bg-polaria-t-08",
    label: "text-polaria-teal",
    icon: "text-polaria-teal",
  },
  warning: {
    box: "border-polaria-warning-border bg-polaria-warning-bg",
    label: "text-polaria-warning",
    icon: "text-polaria-warning",
  },
  neutral: {
    box: "border-polaria-w-08 bg-polaria-w-08",
    label: "text-polaria-w-50",
    icon: "text-polaria-w-50",
  },
};

function FlowEndpoint({ endpoint }: { endpoint: PolariaRequestFlowEndpoint }) {
  const tone = ENDPOINT_TONE[endpoint.tone ?? "neutral"];
  const Icon = endpoint.icon;

  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center rounded-xl border px-4 py-5 text-center",
        tone.box,
      )}
    >
      {Icon ? (
        <Icon
          className={cn("mb-2 h-5 w-5", tone.icon)}
          strokeWidth={1.75}
          aria-hidden
        />
      ) : null}
      <span
        className={cn(
          "polaria-text-badge font-semibold uppercase tracking-wide",
          tone.label,
        )}
      >
        {endpoint.label}
      </span>
      <span className="polaria-text-card-title mt-1 text-polaria-w">
        {endpoint.value}
      </span>
    </div>
  );
}

function MetadataItem({ item }: { item: PolariaRequestMetadataItem }) {
  const Icon = item.icon;

  return (
    <div className="flex min-w-0 items-start gap-2">
      <Icon
        className="mt-0.5 h-4 w-4 shrink-0 text-polaria-w-50"
        strokeWidth={1.75}
        aria-hidden
      />
      <p className="min-w-0 polaria-text-body-sm text-polaria-w-50">
        {item.label}{" "}
        <span className="font-medium text-polaria-w">{item.value}</span>
      </p>
    </div>
  );
}

export function PolariaRequestFlowCard({
  hint,
  source,
  destination,
  typeLabel,
  metadata,
  isInteractive = false,
  onClick,
  className,
}: PolariaRequestFlowCardProps) {
  const content = (
    <>
      {hint ? (
        <p className="polaria-text-body-sm text-polaria-w-50">{hint}</p>
      ) : null}

      <div
        className={cn(
          "flex flex-col items-stretch gap-3 sm:flex-row sm:items-center",
          hint ? "mt-5" : undefined,
        )}
      >
        <FlowEndpoint endpoint={source} />
        <ArrowRight
          className="mx-auto h-5 w-5 shrink-0 text-polaria-w-50 sm:mx-0"
          strokeWidth={1.75}
          aria-hidden
        />
        <FlowEndpoint endpoint={destination} />
      </div>

      {typeLabel ? (
        <div className="mt-4 rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-4 py-3">
          <p className="polaria-text-body-sm text-polaria-w-50">
            Tipo:{" "}
            <span className="font-semibold text-polaria-w">{typeLabel}</span>
          </p>
        </div>
      ) : null}

      {metadata.length > 0 ? (
        <div className="mt-5 grid gap-4 border-t border-polaria-w-08 pt-5 lg:grid-cols-3">
          {metadata.map((item) => (
            <MetadataItem key={item.label} item={item} />
          ))}
        </div>
      ) : null}
    </>
  );

  const cardClassName = cn(
    "rounded-2xl border bg-polaria-t-08 p-5",
    isInteractive
      ? "cursor-pointer border-polaria-t-20 transition hover:border-polaria-teal hover:bg-polaria-w-08"
      : "border-polaria-w-08 opacity-80",
    className,
  );

  if (isInteractive && onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(cardClassName, "w-full text-left")}>
        {content}
      </button>
    );
  }

  return <article className={cardClassName}>{content}</article>;
}
