import { ROUTES } from "@/config/routes";

const PROTECTED_PREFIXES = [
  ROUTES.configurator,
  ROUTES.dashboard,
  ROUTES.platform,
] as const;

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
