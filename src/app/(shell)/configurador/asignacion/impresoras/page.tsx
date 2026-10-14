import { redirect } from "next/navigation";
import { ROUTES } from "@/config/routes";

/** Impresoras viven en el cockpit de cada cuenta. */
export default function ConfiguradorAsignacionImpresorasPage() {
  redirect(ROUTES.configuratorAccounts);
}
