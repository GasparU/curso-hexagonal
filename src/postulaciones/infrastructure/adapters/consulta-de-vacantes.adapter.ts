import { Inject, Injectable } from '@nestjs/common';
import {
  VACANTE_REPOSITORIO,
  VacanteRepositorio,
} from '../../../vacantes/domain/ports/vacante.repository';
import { VacanteId as VacanteIdDeVacantes } from '../../../vacantes/domain/value-objects/vacante-id.vo';
import { ConsultaDeVacantes } from '../../domain/ports/consulta-de-vacantes.port';
import { VacanteId } from '../../domain/value-objects/vacante-id.vo';

/**
 * Contesta el puerto `ConsultaDeVacantes` con el repositorio de Vacantes.
 * Es el único punto donde se tocan los dos contextos, y siempre con un puerto
 * de por medio.
 */
@Injectable()
export class ConsultaDeVacantesAdapter implements ConsultaDeVacantes {
  constructor(
    @Inject(VACANTE_REPOSITORIO) private readonly vacantes: VacanteRepositorio,
  ) {}

  async existe(vacanteId: VacanteId): Promise<boolean> {
    const encontrada = await this.vacantes.buscarPorId(
      VacanteIdDeVacantes.desde(vacanteId.valor),
    );
    return encontrada !== null;
  }
}
