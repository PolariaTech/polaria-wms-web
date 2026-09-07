"use client";

import { cn } from "@/lib/utils/cn";

export function CompradorModalTabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: ReadonlyArray<{ id: T; label: string }>;
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div
      role="tablist"
      className="mb-3 flex flex-wrap gap-2 border-b border-polaria-w-08 pb-3"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              "rounded-xl px-4 py-2 polaria-text-body-sm font-medium transition",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
              isActive
                ? "bg-polaria-teal text-polaria-bg"
                : "border border-polaria-t-20 text-polaria-w-50 hover:bg-polaria-t-08 hover:text-polaria-w",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
