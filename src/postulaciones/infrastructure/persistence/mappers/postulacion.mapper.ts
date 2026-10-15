import { Postulacion } from '../../../domain/entities/postulacion.entity';
import { CorreoElectronico } from '../../../domain/value-objects/correo-electronico.vo';
import { DocumentoIdentidad } from '../../../domain/value-objects/documento-identidad.vo';
import { EstadoPostulacion } from '../../../domain/value-objects/estado-postulacion.vo';
import { NombreCompleto } from '../../../domain/value-objects/nombre-completo.vo';
import { PostulacionId } from '../../../domain/value-objects/postulacion-id.vo';
import { VacanteId } from '../../../domain/value-objects/vacante-id.vo';
import { PostulacionOrmEntity } from '../orm/postulacion.orm-entity';

export class PostulacionMapper {
  static aDominio(fila: PostulacionOrmEntity): Postulacion {
    return Postulacion.reconstruir(
      PostulacionId.desde(fila.id),
      VacanteId.desde(fila.vacanteId),
      NombreCompleto.crear(fila.nombreCompleto),
      DocumentoIdentidad.crear(fila.documentoIdentidad),
      CorreoElectronico.crear(fila.correo),
      EstadoPostulacion.crear(fila.estado),
      fila.creadaEn,
    );
  }

  static aPersistencia(postulacion: Postulacion): PostulacionOrmEntity {
    const fila = new PostulacionOrmEntity();
    fila.id = postulacion.id.valor;
    fila.vacanteId = postulacion.vacanteId.valor;
    fila.nombreCompleto = postulacion.nombreCompleto.valor;
    fila.documentoIdentidad = postulacion.documentoIdentidad.valor;
    fila.correo = postulacion.correo.valor;
    fila.estado = postulacion.estado.valor;
    fila.creadaEn = postulacion.creadaEn;
    return fila;
  }
}
