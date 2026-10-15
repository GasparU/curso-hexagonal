import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { errorDeDominio } from '../../../../comun/domain/errors/error-codes';
import { EventoDeDominio } from '../../../../comun/domain/evento-de-dominio';
import { GENERADOR_DE_ID, GeneradorDeId } from '../../../../comun/domain/ports/generador-id.port';
import {
  PUBLICADOR_DE_EVENTOS,
  PublicadorDeEventos,
} from '../../../../comun/domain/ports/publicador-eventos.port';
import { RELOJ, Reloj } from '../../../../comun/domain/ports/reloj.port';
import { Postulacion } from '../../../domain/entities/postulacion.entity';
import { PostulacionEnviada } from '../../../domain/events/postulacion-enviada.event';
import {
  CONSULTA_DE_VACANTES,
  ConsultaDeVacantes,
} from '../../../domain/ports/consulta-de-vacantes.port';
import {
  POSTULACION_REPOSITORIO,
  PostulacionRepositorio,
} from '../../../domain/ports/postulacion.repository';
import { CorreoElectronico } from '../../../domain/value-objects/correo-electronico.vo';
import { DocumentoIdentidad } from '../../../domain/value-objects/documento-identidad.vo';
import { NombreCompleto } from '../../../domain/value-objects/nombre-completo.vo';
import { PostulacionId } from '../../../domain/value-objects/postulacion-id.vo';
import { VacanteId } from '../../../domain/value-objects/vacante-id.vo';
import { PostularCommand } from './postular.command';

/**
 * Orquesta: valida la vacante, aplica el dedup por DNI, persiste y DESPUÉS
 * publica `PostulacionEnviada` (el evento habla de algo que ya pasó).
 */
@CommandHandler(PostularCommand)
export class PostularHandler implements ICommandHandler<PostularCommand, string> {
  constructor(
    @Inject(POSTULACION_REPOSITORIO) private readonly postulaciones: PostulacionRepositorio,
    @Inject(CONSULTA_DE_VACANTES) private readonly vacantes: ConsultaDeVacantes,
    @Inject(GENERADOR_DE_ID) private readonly generadorDeId: GeneradorDeId,
    @Inject(RELOJ) private readonly reloj: Reloj,
    @Inject(PUBLICADOR_DE_EVENTOS) private readonly publicador: PublicadorDeEventos,
  ) {}

  async execute(comando: PostularCommand): Promise<string> {
    const vacanteId = VacanteId.desde(comando.vacanteId);
    const documento = DocumentoIdentidad.crear(comando.documentoIdentidad);

    // no se puede postular a una vacante que no existe: es error de negocio (404), no un 500
    if (!(await this.vacantes.existe(vacanteId))) {
      throw errorDeDominio('VACANTE_NO_ENCONTRADA');
    }

    // mismo DNI + misma vacante = no se duplica
    if (await this.postulaciones.existePorVacanteYDocumento(vacanteId, documento)) {
      throw errorDeDominio('POSTULANTE_YA_POSTULO');
    }

    const postulacion = Postulacion.registrar(
      PostulacionId.generar(this.generadorDeId),
      vacanteId,
      NombreCompleto.crear(comando.nombreCompleto),
      documento,
      CorreoElectronico.crear(comando.correo),
      this.reloj.ahora(),
    );

    await this.postulaciones.guardar(postulacion);

    const evento: EventoDeDominio = new PostulacionEnviada(
      postulacion.id.valor,
      postulacion.vacanteId.valor,
      postulacion.creadaEn,
    );
    await this.publicador.publicar([evento]);

    return postulacion.id.valor;
  }
}
