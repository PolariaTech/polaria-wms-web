import { ModulePlaceholder } from "@/components/shared/ModulePlaceholder";
import { CONFIGURATOR_PLACEHOLDERS } from "@/modules/configurator";

const content = CONFIGURATOR_PLACEHOLDERS.creation;

export default function ConfiguradorCreacionPage() {
  return (
    <ModulePlaceholder
      title={content.title}
      description={content.description}
      scope="platform"
      futureActions={content.futureActions}
    />
  );
}
