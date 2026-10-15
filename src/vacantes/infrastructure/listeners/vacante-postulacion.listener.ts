import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PostulacionEnviada } from '../../../postulaciones/domain/events/postulacion-enviada.event';
import { VACANTE_REPOSITORIO, VacanteRepositorio } from '../../domain/ports/vacante.repository';
import { VacanteId } from '../../domain/value-objects/vacante-id.vo';

/**
 * Escucha el evento que llega del otro contexto y suma el contador de la vacante.
 * Vive en infraestructura porque cruza la frontera entre contextos.
 */
@Injectable()
export class VacantePostulacionListener {
  private readonly logger = new Logger(VacantePostulacionListener.name);

  constructor(@Inject(VACANTE_REPOSITORIO) private readonly vacantes: VacanteRepositorio) {}

  @OnEvent('PostulacionEnviada')
  async alRecibirPostulacion(evento: PostulacionEnviada): Promise<void> {
    const vacante = await this.vacantes.buscarPorId(VacanteId.desde(evento.vacanteId));

    if (!vacante) {
      // la postulación ya se guardó; si la vacante no está, avisamos y no rompemos
      this.logger.warn(`Llegó una postulación de una vacante inexistente: ${evento.vacanteId}`);
      return;
    }

    vacante.registrarPostulacion();
    await this.vacantes.guardar(vacante);
  }
}
