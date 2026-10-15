/**
 * Puerto para saber "qué hora es". El dominio no usa `new Date()` directo:
 * así los tests pueden fijar el tiempo.
 */
export interface Reloj {
  ahora(): Date;
}

export const RELOJ = Symbol('Reloj');
