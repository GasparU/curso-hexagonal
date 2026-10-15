export type ErrorKind = 'VALIDATION' | 'NOT_FOUND' | 'CONFLICT';

/**
 * Error de negocio. El dominio no conoce códigos HTTP: solo declara su `kind`
 * y un único filtro de infraestructura lo traduce.
 *
 * Está en `comun/` porque lo lanzan los dos contextos: si cada uno tuviera su
 * propia clase, el filtro tendría que conocerlas todas.
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
