import { Module } from '@nestjs/common';
import { GENERADOR_DE_ID } from '../domain/ports/generador-id.port';
import { PUBLICADOR_DE_EVENTOS } from '../domain/ports/publicador-eventos.port';
import { RELOJ } from '../domain/ports/reloj.port';
import { NestPublicadorDeEventos } from './nest-publicador-eventos';
import { SistemaReloj } from './sistema-reloj';
import { UuidGeneradorDeId } from './uuid-generador-id';

/**
 * Núcleo compartido: los adaptadores transversales que usan TODOS los contextos
 * (reloj, generador de ids, publicador de eventos). Se cablean una sola vez acá.
 */
@Module({
  providers: [
    { provide: PUBLICADOR_DE_EVENTOS, useClass: NestPublicadorDeEventos },
    { provide: RELOJ, useClass: SistemaReloj },
    { provide: GENERADOR_DE_ID, useClass: UuidGeneradorDeId },
  ],
  exports: [PUBLICADOR_DE_EVENTOS, RELOJ, GENERADOR_DE_ID],
})
export class ComunModule {}
