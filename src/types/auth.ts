export type AuthScope = "platform" | "tenant";
export type AuthFlow = "platform" | "tenant";

/** Nivel jerárquico del rol dentro del tenant (API /auth/me). */
export type NivelRol = "platform" | "empresa" | "cuenta" | "bodega";

export interface UserPreview {
  nombre: string;
  identificador: string;
  empresa?: {
    nombre: string;
    codigo: string;
  };
}

export interface PreloginRequest {
  identificador: string;
  codigoEmpresa?: string;
}

export interface PreloginResponse {
  flow: AuthFlow;
  userPreview: UserPreview;
}

export interface LoginRequest {
  identificador: string;
  password: string;
  codigoEmpresa?: string;
}

/** Contexto tenant propagado desde login y GET /auth/me. */
export interface TenantContext {
  codigoEmpresa: string | null;
  codigoCuenta: string | null;
  idBodegas: string[];
  nivelRol: NivelRol;
}

/** Contexto devuelto por POST /auth/login y persistido tras GET /auth/me. */
export interface AuthContext extends TenantContext {
  scope: AuthScope;
}

/** Entrada parcial desde login/SSO antes de hidratar con GET /auth/me. */
export type AuthContextInput = Pick<AuthContext, "scope"> &
  Partial<TenantContext>;

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  context: Pick<AuthContext, "scope">;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/** Respuesta de GET /auth/me */
export interface MateoHandoffResponse {
  code: string;
  expiresIn: number;
}

/** Usuario devuelto por POST /auth/mateo-exchange (SSO Mateo → WMS) */
export interface MateoExchangeUser {
  idUsuario: string;
  username: string;
  nombre: string;
  correo: string;
  nombreRol: string;
  codigoEmpresa: string | null;
  codigoCuenta: string | null;
  scope: AuthScope;
}

/** Respuesta de POST /auth/mateo-exchange (SSO Mateo → WMS) */
export interface MateoExchangeResponse {
  accessToken: string;
  refreshToken: string;
  user: MateoExchangeUser;
}

export interface AuthSession {
  idUsuario: string;
  idAuth: string;
  nombre: string;
  username: string;
  correo: string;
  idRol: string;
  nombreRol: string;
  nivelRol: NivelRol;
  codigoEmpresa: string | null;
  razonSocialEmpresa: string | null;
  codigoCuenta: string | null;
  nombreComercialCuenta: string | null;
  /** Bodegas activas asignadas al usuario (vacío en scope platform). */
  idBodegas: string[];
  scope: AuthScope;
}

export function createEmptyTenantContext(): TenantContext {
  return {
    codigoEmpresa: null,
    codigoCuenta: null,
    idBodegas: [],
    nivelRol: "platform",
  };
}

export function createMinimalAuthContext(scope: AuthScope): AuthContext {
  return {
    scope,
    ...createEmptyTenantContext(),
  };
}
