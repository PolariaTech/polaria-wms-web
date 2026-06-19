export type AuthScope = "platform" | "tenant";
export type AuthFlow = "platform" | "tenant";

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

/** Contexto mínimo devuelto por POST /auth/login */
export interface AuthContext {
  scope: AuthScope;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  context: AuthContext;
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

export interface AuthSession {
  idUsuario: string;
  idAuth: string;
  nombre: string;
  username: string;
  correo: string;
  idRol: string;
  nombreRol: string;
  nivelRol: string;
  codigoEmpresa: string | null;
  razonSocialEmpresa: string | null;
  codigoCuenta: string | null;
  nombreComercialCuenta: string | null;
  scope: AuthScope;
}
