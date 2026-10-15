import { errorDeDominio } from '../../../comun/domain/errors/error-codes';
import { ConsultaDeVacantes } from '../ports/consulta-de-vacantes.port';
import { PostulacionRepositorio } from '../ports/postulacion.repository';
import { DocumentoIdentidad } from '../value-objects/documento-identidad.vo';
import { VacanteId } from '../value-objects/vacante-id.vo';

/**
 * Servicio de DOMINIO: reglas que NO pertenecen a una sola Postulacion sino al
 * conjunto de postulaciones — no hay dos del mismo DNI en la misma vacante, y
 * solo se puede postular a una vacante que existe.
 *
 * Por eso no vive en el caso de uso: el handler solo orquesta (persistir y
 * publicar). Depende de los PUERTOS del dominio, no de los repositorios concretos.
 */
export class RegistroDePostulaciones {
  constructor(
    private readonly postulaciones: PostulacionRepositorio,
    private readonly vacantes: ConsultaDeVacantes,
  ) {}

  /** Deja pasar la postulación o lanza el error de negocio que corresponda. */
  async asegurarQueSePuedaRegistrar(
    vacanteId: VacanteId,
    documento: DocumentoIdentidad,
  ): Promise<void> {
    if (!(await this.vacantes.existe(vacanteId))) {
      throw errorDeDominio('VACANTE_NO_ENCONTRADA');
    }

    if (await this.postulaciones.existePorVacanteYDocumento(vacanteId, documento)) {
      throw errorDeDominio('POSTULANTE_YA_POSTULO');
    }
  }
}

export const REGISTRO_DE_POSTULACIONES = Symbol('RegistroDePostulaciones');
