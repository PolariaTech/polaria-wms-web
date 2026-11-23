import { PolariaFormInput } from "@/components/shared/form/PolariaFormField";
import type { ImpresoraCamino } from "@/modules/configurator/impresoras/services/impresoras.service";
import { CAMINOS, type ImpresoraFormState } from "./impresora-create-modal.constants";

export function ImpresoraCreateCaminoPicker({
  camino: selected,
  disabled,
  onChange,
}: {
  camino: ImpresoraCamino;
  disabled: boolean;
  onChange: (camino: ImpresoraCamino) => void;
}) {
  return (
    <section className="space-y-2">
      <p className="polaria-text-caption text-polaria-w-50">
        Cómo imprime
      </p>
      <div className="grid gap-2 sm:grid-cols-3">
        {CAMINOS.map((camino) => {
          const active = selected === camino.id;
          return (
            <button
              key={camino.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(camino.id)}
              className={`rounded-xl border px-3 py-3 text-left transition-opacity ${
                active
                  ? "border-polaria-teal bg-polaria-t-08"
                  : "border-polaria-w-08 bg-polaria-bg hover:border-polaria-t-20"
              }`}
            >
              <span className="block text-sm font-semibold text-polaria-w">
                {camino.title}
              </span>
              <span className="mt-0.5 block text-xs text-polaria-w-50">
                {camino.hint}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function ImpresoraCreateCaminoFields({
  form,
  updateField,
}: {
  form: ImpresoraFormState;
  updateField: <K extends keyof ImpresoraFormState>(
    key: K,
    value: ImpresoraFormState[K],
  ) => void;
}) {
  return (
    <>
  {form.camino === "qz" ? (
    <section className="space-y-3">
      <PolariaFormInput
        id="imp-windows"
        label="Nombre en Windows"
        value={form.nombreSistema}
        onChange={(e) => updateField("nombreSistema", e.target.value)}
        placeholder="Como aparece en Impresoras de Windows"
        required
        compact
      />
      <p className="text-xs text-polaria-w-50">
        Instala QZ Tray en el PC que imprime (
        <a
          href="https://qz.io/download/"
          target="_blank"
          rel="noreferrer"
          className="text-polaria-teal underline"
        >
          qz.io
        </a>
        ).
      </p>
    </section>
  ) : null}

  {form.camino === "brother_email" ? (
    <section className="space-y-3">
      <PolariaFormInput
        id="imp-email-brother"
        label="Correo de la impresora"
        value={form.emailDestino}
        onChange={(e) => updateField("emailDestino", e.target.value)}
        placeholder="ejemplo@print.brother.com"
        type="email"
        required
        compact
      />
      <p className="text-xs text-polaria-w-50">
        En la Brother: Apps → Attach, Email and Print → copia el correo
        único de la máquina.
      </p>
    </section>
  ) : null}

  {form.camino === "epson_connect" ? (
    <section className="space-y-3">
      <PolariaFormInput
        id="imp-email-epson"
        label="Correo Epson Connect"
        value={form.emailDestino}
        onChange={(e) => updateField("emailDestino", e.target.value)}
        placeholder="ejemplo@print.epsonconnect.com"
        type="email"
        required
        compact
      />
      <p className="text-xs text-polaria-w-50">
        Activa Remote Print en Epson Connect. El envío usa SMTP /
        credenciales del servidor.
      </p>
    </section>
  ) : null}
    </>
  );
}
