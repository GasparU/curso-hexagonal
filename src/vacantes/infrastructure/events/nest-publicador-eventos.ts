import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventoDeDominio } from '../../domain/events/evento-de-dominio';
import {
  PublicadorDeEventos,
} from '../../domain/ports/publicador-eventos.port';

/**
 * Adaptador de eventos: traduce la lista de eventos del dominio a emisiones de
 * EventEmitter2, usando el NOMBRE DE LA CLASE como nombre del evento.
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
