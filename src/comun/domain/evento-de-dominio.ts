/**
 * Todo evento de dominio lleva cuándo ocurrió. Los eventos son clases planas,
 * con el nombre en PASADO (ya pasó algo).
 *
 * Vive en `comun/` porque el publicador de eventos es transversal a los contextos.
 */
export interface EventoDeDominio {
  readonly ocurridaEn: Date;
}
