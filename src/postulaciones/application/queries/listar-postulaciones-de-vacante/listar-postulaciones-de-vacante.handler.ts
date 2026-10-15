import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { errorDeDominio } from '../../../../comun/domain/errors/error-codes';
import { Postulacion } from '../../../domain/entities/postulacion.entity';
import {
  CONSULTA_DE_VACANTES,
  ConsultaDeVacantes,
} from '../../../domain/ports/consulta-de-vacantes.port';
import {
  POSTULACION_REPOSITORIO,
  PostulacionRepositorio,
} from '../../../domain/ports/postulacion.repository';
import { VacanteId } from '../../../domain/value-objects/vacante-id.vo';
import { ListarPostulacionesDeVacanteQuery } from './listar-postulaciones-de-vacante.query';
import { PostulacionVista } from './postulacion.vista';

@QueryHandler(ListarPostulacionesDeVacanteQuery)
export class ListarPostulacionesDeVacanteHandler
  implements IQueryHandler<ListarPostulacionesDeVacanteQuery, PostulacionVista[]>
{
  constructor(
    @Inject(POSTULACION_REPOSITORIO) private readonly postulaciones: PostulacionRepositorio,
    @Inject(CONSULTA_DE_VACANTES) private readonly vacantes: ConsultaDeVacantes,
  ) {}

  async execute(consulta: ListarPostulacionesDeVacanteQuery): Promise<PostulacionVista[]> {
    const vacanteId = VacanteId.desde(consulta.vacanteId);

    if (!(await this.vacantes.existe(vacanteId))) {
      throw errorDeDominio('VACANTE_NO_ENCONTRADA');
    }

    const postulaciones = await this.postulaciones.listarPorVacante(vacanteId);
    return postulaciones.map((postulacion) => this.aVista(postulacion));
  }

  private aVista(postulacion: Postulacion): PostulacionVista {
    return {
      id: postulacion.id.valor,
      vacanteId: postulacion.vacanteId.valor,
      nombreCompleto: postulacion.nombreCompleto.valor,
      documentoIdentidad: postulacion.documentoIdentidad.valor,
      correo: postulacion.correo.valor,
      estado: postulacion.estado.valor,
      creadaEn: postulacion.creadaEn.toISOString(),
    };
  }
}
