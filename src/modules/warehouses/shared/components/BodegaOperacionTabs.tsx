"use client";

import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export interface BodegaOperacionTab<T extends string = string> {
  id: T;
  label: string;
  href: string;
}

interface BodegaOperacionTabsProps<T extends string> {
  tabs: readonly BodegaOperacionTab<T>[];
  activeTab: T;
  ariaLabel?: string;
}

export function BodegaOperacionTabs<T extends string>({
  tabs,
  activeTab,
  ariaLabel = "Operación de bodega",
}: BodegaOperacionTabsProps<T>) {
  return (
    <nav aria-label={ariaLabel} className="flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;

        return (
          <Link
            key={tab.id}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-medium transition",
              isActive
                ? "bg-polaria-teal text-polaria-bg"
                : "border border-polaria-t-20 text-polaria-w-50 hover:bg-polaria-t-08",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
