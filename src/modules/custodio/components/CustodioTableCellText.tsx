import { cn } from "@/lib/utils/cn";

interface CustodioTableCellTextProps {
  text: string;
  title?: string;
  className?: string;
}

export function CustodioTableCellText({
  text,
  title,
  className,
}: CustodioTableCellTextProps) {
  return (
    <span
      className={cn(className)}
      title={title ?? (text !== "—" ? text : undefined)}
    >
      {text}
    </span>
  );
}
