import type { AdminMenuOption } from "../types/admin-assignment-creation.types";
import { AdminMenuRowCard } from "./AdminMenuRowCard";

interface AdminMenuSectionProps {
  title: string;
  options: readonly AdminMenuOption[];
  onOptionClick?: (optionId: AdminMenuOption["id"]) => void;
}

export function AdminMenuSection({
  title,
  options,
  onOptionClick,
}: AdminMenuSectionProps) {
  return (
    <section aria-label={title}>
      <h2 className="polaria-text-body-sm mb-3 font-semibold text-polaria-w-50">
        {title}
      </h2>
      <div className="flex flex-col gap-2.5">
        {options.map((option) => (
          <AdminMenuRowCard
            key={option.id}
            option={option}
            onClick={onOptionClick}
          />
        ))}
      </div>
    </section>
  );
}
