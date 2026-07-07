import {
  CONFIGURATOR_PANEL_SUBTITLE,
  CONFIGURATOR_PANEL_TITLE,
} from "@/modules/configurator/shared/constants/configurator-actions";

export function ConfiguratorHeader() {
  return (
    <section className="mx-auto max-w-4xl px-4 text-center sm:px-6">
      <h1 className="polaria-text-display">{CONFIGURATOR_PANEL_TITLE}</h1>
      <p className="polaria-text-subtitle mt-3">
        {CONFIGURATOR_PANEL_SUBTITLE}
      </p>
    </section>
  );
}
