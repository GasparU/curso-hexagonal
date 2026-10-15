export type ErrorKind = 'VALIDATION' | 'NOT_FOUND' | 'CONFLICT';

/**
 * Error de negocio. El dominio NO conoce códigos HTTP: solo declara su `kind`.
 * Un único filtro de infraestructura traduce `kind` -> HTTP.
 */
export class DomainException extends Error {
  constructor(
    readonly code: string,
    readonly kind: ErrorKind,
    message: string,
  ) {
    super(message);
    this.name = 'DomainException';
  }
}
