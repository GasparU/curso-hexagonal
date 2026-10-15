import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  GENERADOR_DE_ID,
  GeneradorDeId,
} from '../../../../comun/domain/ports/generador-id.port';
import {
  PUBLICADOR_DE_EVENTOS,
  PublicadorDeEventos,
} from '../../../../comun/domain/ports/publicador-eventos.port';
import { RELOJ, Reloj } from '../../../../comun/domain/ports/reloj.port';
import { Postulacion } from '../../../domain/entities/postulacion.entity';
import {
  POSTULACION_REPOSITORIO,
  PostulacionRepositorio,
} from '../../../domain/ports/postulacion.repository';
import {
  REGISTRO_DE_POSTULACIONES,
  RegistroDePostulaciones,
} from '../../../domain/services/registro-de-postulaciones';
import { CorreoElectronico } from '../../../domain/value-objects/correo-electronico.vo';
import { DocumentoIdentidad } from '../../../domain/value-objects/documento-identidad.vo';
import { NombreCompleto } from '../../../domain/value-objects/nombre-completo.vo';
import { PostulacionId } from '../../../domain/value-objects/postulacion-id.vo';
import { VacanteId } from '../../../domain/value-objects/vacante-id.vo';
import { PostularCommand } from './postular.command';

/**
 * Orquesta: deja que el dominio valide las reglas, persiste y recién ahí publica
 * los eventos que registró la entidad.
 */
@CommandHandler(PostularCommand)
export class PostularHandler implements ICommandHandler<PostularCommand, string> {
  constructor(
    @Inject(POSTULACION_REPOSITORIO) private readonly postulaciones: PostulacionRepositorio,
    @Inject(REGISTRO_DE_POSTULACIONES) private readonly registro: RegistroDePostulaciones,
    @Inject(GENERADOR_DE_ID) private readonly generadorDeId: GeneradorDeId,
    @Inject(RELOJ) private readonly reloj: Reloj,
    @Inject(PUBLICADOR_DE_EVENTOS) private readonly publicador: PublicadorDeEventos,
  ) {}

  async execute(comando: PostularCommand): Promise<string> {
    const vacanteId = VacanteId.desde(comando.vacanteId);
    const documento = DocumentoIdentidad.crear(comando.documentoIdentidad);

    // las reglas de negocio viven en el dominio, no acá
    await this.registro.asegurarQueSePuedaRegistrar(vacanteId, documento);

    const postulacion = Postulacion.registrar(
      PostulacionId.generar(this.generadorDeId),
      vacanteId,
      NombreCompleto.crear(comando.nombreCompleto),
      documento,
      CorreoElectronico.crear(comando.correo),
      this.reloj.ahora(),
    );

    await this.postulaciones.guardar(postulacion);

    // los eventos los registró la entidad; se publican recién después de guardar
    await this.publicador.publicar(postulacion.tomarEventos());

    return postulacion.id.valor;
  }
}
