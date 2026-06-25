export type DomainServiceErrorCode =
  | "SUPABASE_NOT_CONFIGURED"
  | "TENANT_CONTEXT_MISSING"
  | "QUERY_FAILED"
  | "INVALID_ARGUMENT";

export class DomainServiceError extends Error {
  readonly code: DomainServiceErrorCode;
  readonly cause?: unknown;

  constructor(
    message: string,
    code: DomainServiceErrorCode,
    cause?: unknown,
  ) {
    super(message);
    this.name = "DomainServiceError";
    this.code = code;
    this.cause = cause;
  }
}
