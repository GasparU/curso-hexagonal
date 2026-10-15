import { Inject, Injectable } from '@nestjs/common';
import {
  VACANTE_REPOSITORIO,
  VacanteRepositorio,
} from '../../../vacantes/domain/ports/vacante.repository';
import { VacanteId as VacanteIdDeVacantes } from '../../../vacantes/domain/value-objects/vacante-id.vo';
import { ConsultaDeVacantes } from '../../domain/ports/consulta-de-vacantes.port';
import { VacanteId } from '../../domain/value-objects/vacante-id.vo';

/**
 * Adaptador que contesta el puerto `ConsultaDeVacantes` usando el repositorio de
 * Vacantes. Es el ÚNICO punto donde se cruzan los dos contextos: acá, en
 * infraestructura, con un puerto de por medio (§4).
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
