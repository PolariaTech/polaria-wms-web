"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { getPostLoginRoute } from "@/config/routes";
import { prelogin } from "@/modules/auth";
import { resolveTenantEmpresasForLogin } from "@/modules/auth/services/login-tenant-context.service";
import type { TenantEmpresaOption } from "@/modules/auth/services/login-tenant-context.service";
import { ApiError } from "@/services/api";
import { useAuthStore } from "@/stores/auth.store";
import type { AuthFlow, AuthSession, UserPreview } from "@/types/auth";
import { LoginStepPassword } from "./LoginStepPassword";
import { LoginStepSuccess } from "./LoginStepSuccess";
import { LoginStepUser } from "./LoginStepUser";

type Step = "user" | "password" | "success";

const REDIRECT_DELAY_MS = 2000;

function pickCodigoEmpresa(
  manualCodigo: string,
  empresas: TenantEmpresaOption[],
): string {
  const trimmed = manualCodigo.trim();
  if (trimmed) return trimmed;
  if (empresas.length === 1) return empresas[0]?.codigoEmpresa ?? "";
  return "";
}

function buildUserPreviewWithEmpresa(
  preview: UserPreview,
  codigoEmpresa: string,
  empresas: TenantEmpresaOption[],
): UserPreview {
  if (preview.empresa?.codigo || preview.empresa?.nombre) {
    return preview;
  }

  const codigo = codigoEmpresa.trim();
  if (!codigo) return preview;

  const matched = empresas.find((empresa) => empresa.codigoEmpresa === codigo);

  return {
    ...preview,
    empresa: {
      codigo,
      nombre: matched?.razonSocial || codigo,
    },
  };
}

export function LoginFlow() {
  const router = useRouter();
  const performLogin = useAuthStore((s) => s.performLogin);

  const [step, setStep] = useState<Step>("user");
  const [identificador, setIdentificador] = useState("");
  const [codigoEmpresa, setCodigoEmpresa] = useState("");
  const [empresaOptions, setEmpresaOptions] = useState<TenantEmpresaOption[]>(
    [],
  );
  const [password, setPassword] = useState("");
  const [flow, setFlow] = useState<AuthFlow | null>(null);
  const [userPreview, setUserPreview] = useState<UserPreview | null>(null);
  const [successSession, setSuccessSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePrelogin = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    const email = identificador.trim();

    try {
      const empresas = await resolveTenantEmpresasForLogin(email);
      setEmpresaOptions(empresas);

      const resolvedCodigo = pickCodigoEmpresa(codigoEmpresa, empresas);
      if (resolvedCodigo && resolvedCodigo !== codigoEmpresa) {
        setCodigoEmpresa(resolvedCodigo);
      }

      if (empresas.length > 1 && !resolvedCodigo) {
        setError("Selecciona la empresa a la que perteneces.");
        return;
      }

      const payload: { identificador: string; codigoEmpresa?: string } = {
        identificador: email,
      };

      if (resolvedCodigo) {
        payload.codigoEmpresa = resolvedCodigo;
      }

      const response = await prelogin(payload);
      setFlow(response.flow);

      const previewCodigo =
        response.userPreview.empresa?.codigo?.trim() || resolvedCodigo;
      if (previewCodigo) {
        setCodigoEmpresa(previewCodigo);
      }

      setUserPreview(
        buildUserPreviewWithEmpresa(
          response.userPreview,
          previewCodigo,
          empresas,
        ),
      );
      setStep("password");
      setPassword("");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Ocurrió un error inesperado");
      }
    } finally {
      setIsLoading(false);
    }
  }, [codigoEmpresa, identificador]);

  const handleLogin = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      const payload: {
        identificador: string;
        password: string;
        codigoEmpresa?: string;
      } = {
        identificador: identificador.trim(),
        password,
      };

      const tenantCodigo =
        codigoEmpresa.trim() || userPreview?.empresa?.codigo?.trim() || "";

      if (flow === "tenant" && tenantCodigo) {
        payload.codigoEmpresa = tenantCodigo;
      }

      const authSession = await performLogin(payload);
      setSuccessSession(authSession);
      setStep("success");

      setTimeout(() => {
        router.replace(getPostLoginRoute(authSession.scope));
      }, REDIRECT_DELAY_MS);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Ocurrió un error inesperado");
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    codigoEmpresa,
    flow,
    identificador,
    password,
    performLogin,
    router,
    userPreview?.empresa?.codigo,
  ]);

  const handleBack = () => {
    setStep("user");
    setPassword("");
    setError(null);
  };

  if (step === "success" && successSession) {
    return <LoginStepSuccess session={successSession} />;
  }

  if (step === "password" && userPreview) {
    return (
      <LoginStepPassword
        userPreview={userPreview}
        password={password}
        isLoading={isLoading}
        error={error}
        onPasswordChange={setPassword}
        onBack={handleBack}
        onSubmit={handleLogin}
      />
    );
  }

  return (
    <LoginStepUser
      identificador={identificador}
      codigoEmpresa={codigoEmpresa}
      empresaOptions={empresaOptions}
      isLoading={isLoading}
      error={error}
      onIdentificadorChange={setIdentificador}
      onCodigoEmpresaChange={setCodigoEmpresa}
      onSubmit={handlePrelogin}
    />
  );
}
