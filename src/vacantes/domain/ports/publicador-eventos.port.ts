import { EventoDeDominio } from '../events/evento-de-dominio';

export interface PublicadorDeEventos {
  publicar(eventos: EventoDeDominio[]): Promise<void>;
}

export const PUBLICADOR_DE_EVENTOS = Symbol('PublicadorDeEventos');
