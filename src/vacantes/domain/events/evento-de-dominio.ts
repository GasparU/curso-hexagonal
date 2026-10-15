/**
 * Todo evento de dominio lleva cuándo ocurrió. Los eventos son clases planas,
 * con el nombre en PASADO (ya pasó algo).
 */
export interface EventoDeDominio {
  readonly ocurridaEn: Date;
}
