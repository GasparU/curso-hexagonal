/**
 * Todo evento de dominio lleva cuándo ocurrió. Son clases planas y con el nombre
 * en pasado, porque describen algo que ya pasó.
 *
 * Está en `comun/` porque lo usan los dos contextos.
 */
export interface EventoDeDominio {
  readonly ocurridaEn: Date;
}
