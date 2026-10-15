import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventoDeDominio } from '../domain/evento-de-dominio';
import { PublicadorDeEventos } from '../domain/ports/publicador-eventos.port';

/**
 * Adaptador de eventos: convierte la lista de eventos del dominio en emisiones
 * de EventEmitter2. El nombre del evento es el de la clase.
 */
@Injectable()
export class NestPublicadorDeEventos implements PublicadorDeEventos {
  constructor(private readonly emisor: EventEmitter2) {}

  async publicar(eventos: EventoDeDominio[]): Promise<void> {
    for (const evento of eventos) {
      await this.emisor.emitAsync(evento.constructor.name, evento);
    }
  }
}
