import { describe, expect, it } from "vitest";
import {
  canAccessModule,
  hasPermission,
  type WmsModule,
} from "@/constants/wms/permissions";
import { hasMinNivelRol, WmsRol } from "@/constants/wms/roles";
import type { NivelRol } from "@/types/auth/auth";
import { filterNavItems, TENANT_NAV, type NavItem } from "./navigation";

interface AccessContext {
  idRol: string;
  nivelRol: NivelRol;
}

/** Réplica de la lógica AND de ModuleRoleGate para criterios de un NavItem. */
function evaluateModuleRoleGate(
  context: AccessContext,
  item: Pick<NavItem, "permission" | "module" | "minNivelRol" | "roles">,
): boolean {
  const requirements: boolean[] = [];

  if (item.permission !== undefined) {
    requirements.push(hasPermission(context.idRol, item.permission));
  }

  if (item.module !== undefined) {
    requirements.push(
      canAccessModule(context.idRol, context.nivelRol, item.module),
    );
  }

  if (item.minNivelRol !== undefined) {
    requirements.push(hasMinNivelRol(context.nivelRol, item.minNivelRol));
  }

  if (item.roles !== undefined) {
    requirements.push(item.roles.includes(context.idRol));
  }

  if (requirements.length === 0) {
    return true;
  }

  return requirements.every(Boolean);
}

function navVisible(context: AccessContext, item: NavItem): boolean {
  return (
    filterNavItems([item], {
      scope: "tenant",
      idRol: context.idRol,
      nivelRol: context.nivelRol,
    }).length > 0
  );
}

const scenarios: Array<{
  label: string;
  context: AccessContext;
}> = [
  {
    label: "operario bodega",
    context: { idRol: WmsRol.operario, nivelRol: "bodega" },
  },
  {
    label: "custodio bodega",
    context: { idRol: WmsRol.custodio, nivelRol: "bodega" },
  },
  {
    label: "jefe bodega",
    context: { idRol: WmsRol.jefe_bodega, nivelRol: "bodega" },
  },
  {
    label: "administrador cuenta",
    context: { idRol: WmsRol.administrador_cuenta, nivelRol: "cuenta" },
  },
  {
    label: "operador cuenta",
    context: { idRol: WmsRol.operador_cuenta, nivelRol: "cuenta" },
  },
  {
    label: "procesador",
    context: { idRol: WmsRol.procesador, nivelRol: "bodega" },
  },
  {
    label: "transportista",
    context: { idRol: WmsRol.transportista, nivelRol: "bodega" },
  },
  {
    label: "admin empresa",
    context: { idRol: WmsRol.administrador_cuenta, nivelRol: "empresa" },
  },
];

describe("integración navigation + ModuleRoleGate", () => {
  it.each(scenarios)(
    "coincide visibilidad nav y gate para $label",
    ({ context }) => {
      for (const item of TENANT_NAV) {
        const visible = navVisible(context, item);
        const gateAllows = evaluateModuleRoleGate(context, item);

        expect(visible, `nav ${item.href}`).toBe(gateAllows);
      }
    },
  );

  it("mapa exige roles de bodega igual que RoleGate de la vista", () => {
    const mapa = TENANT_NAV.find((item) => item.label === "Mapa");
    expect(mapa?.roles).toContain(WmsRol.operario);
    expect(mapa?.roles).not.toContain(WmsRol.administrador_cuenta);

    const operario = { idRol: WmsRol.operario, nivelRol: "bodega" as const };
    const transportista = {
      idRol: WmsRol.transportista,
      nivelRol: "bodega" as const,
    };
    const adminCuenta = {
      idRol: WmsRol.administrador_cuenta,
      nivelRol: "cuenta" as const,
    };

    expect(evaluateModuleRoleGate(operario, mapa!)).toBe(true);
    expect(evaluateModuleRoleGate(transportista, mapa!)).toBe(false);
    expect(evaluateModuleRoleGate(adminCuenta, mapa!)).toBe(false);
    expect(navVisible(operario, mapa!)).toBe(true);
    expect(navVisible(transportista, mapa!)).toBe(false);
    expect(navVisible(adminCuenta, mapa!)).toBe(false);
  });

  it("operador cuenta no ve transporte ni ingreso", () => {
    const ingreso = TENANT_NAV.find((item) => item.label === "Ingreso");
    const transporte = TENANT_NAV.find((item) => item.label === "Transporte");
    const context = { idRol: WmsRol.operador_cuenta, nivelRol: "cuenta" as const };

    expect(navVisible(context, ingreso!)).toBe(false);
    expect(navVisible(context, transporte!)).toBe(false);
  });

  it("reportería exige módulo audit (nivel empresa)", () => {
    const reporteria = TENANT_NAV.find((item) => item.label === "Reportería");
    expect(reporteria?.module).toBe("audit" satisfies WmsModule);

    expect(
      navVisible(
        { idRol: WmsRol.administrador_cuenta, nivelRol: "cuenta" },
        reporteria!,
      ),
    ).toBe(false);

    expect(
      navVisible(
        { idRol: WmsRol.administrador_cuenta, nivelRol: "empresa" },
        reporteria!,
      ),
    ).toBe(true);
  });
});
