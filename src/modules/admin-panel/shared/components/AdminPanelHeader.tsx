import {
  ADMIN_PANEL_SUBTITLE,
  ADMIN_PANEL_TITLE,
} from "@/modules/admin-panel/shared/constants/admin-panel-actions";

export function AdminPanelHeader() {
  return (
    <section className="mx-auto max-w-4xl px-4 text-center sm:px-6">
      <h1 className="polaria-text-display">{ADMIN_PANEL_TITLE}</h1>
      <p className="polaria-text-subtitle mt-3">{ADMIN_PANEL_SUBTITLE}</p>
    </section>
  );
}
