import { ModulePlaceholder } from "@/components/shared/ModulePlaceholder";
import { CONFIGURATOR_PLACEHOLDERS } from "@/modules/configurator";

const content = CONFIGURATOR_PLACEHOLDERS.integration;

export default function ConfiguradorIntegracionPage() {
  return (
    <ModulePlaceholder
      title={content.title}
      description={content.description}
      scope="platform"
      futureActions={content.futureActions}
    />
  );
}
