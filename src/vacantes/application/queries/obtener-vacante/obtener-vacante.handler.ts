import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { errorDeDominio } from '../../../../comun/domain/errors/error-codes';
import { VACANTE_REPOSITORIO, VacanteRepositorio } from '../../../domain/ports/vacante.repository';
import { VacanteId } from '../../../domain/value-objects/vacante-id.vo';
import { ObtenerVacanteQuery } from './obtener-vacante.query';
import { VacanteVista } from './vacante.vista';

@QueryHandler(ObtenerVacanteQuery)
export class ObtenerVacanteHandler implements IQueryHandler<ObtenerVacanteQuery, VacanteVista> {
  constructor(@Inject(VACANTE_REPOSITORIO) private readonly vacantes: VacanteRepositorio) {}

  async execute(consulta: ObtenerVacanteQuery): Promise<VacanteVista> {
    const vacante = await this.vacantes.buscarPorId(VacanteId.desde(consulta.vacanteId));
    if (!vacante) {
      throw errorDeDominio('VACANTE_NO_ENCONTRADA');
    }

    return {
      id: vacante.id.valor,
      titulo: vacante.titulo.valor,
      descripcion: vacante.descripcion.valor,
      perfilCargo: vacante.perfil.valor,
      estado: vacante.estado.valor,
      creadaEn: vacante.creadaEn.toISOString(),
      publicadaEn: vacante.publicadaEn ? vacante.publicadaEn.toISOString() : null,
      cerradaEn: vacante.cerradaEn ? vacante.cerradaEn.toISOString() : null,
      postulacionesRecibidas: vacante.postulacionesRecibidas,
    };
  }
}
