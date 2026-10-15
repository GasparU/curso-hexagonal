import { Postulacion } from '../../../domain/entities/postulacion.entity';
import { PostulacionOrmEntity } from '../orm/postulacion.orm-entity';

/**
 * Traduce entre la fila del ORM y la entidad del dominio, en los dos sentidos,
 * pasando por primitivos.
 */
export class PostulacionMapper {
  static aDominio(fila: PostulacionOrmEntity): Postulacion {
    return Postulacion.fromPrimitives({
      id: fila.id,
      vacanteId: fila.vacanteId,
      nombreCompleto: fila.nombreCompleto,
      documentoIdentidad: fila.documentoIdentidad,
      correo: fila.correo,
      estado: fila.estado,
      creadaEn: fila.creadaEn,
    });
  }

  static aPersistencia(postulacion: Postulacion): PostulacionOrmEntity {
    const primitivas = postulacion.toPrimitives();

    const fila = new PostulacionOrmEntity();
    fila.id = primitivas.id;
    fila.vacanteId = primitivas.vacanteId;
    fila.nombreCompleto = primitivas.nombreCompleto;
    fila.documentoIdentidad = primitivas.documentoIdentidad;
    fila.correo = primitivas.correo;
    fila.estado = primitivas.estado;
    fila.creadaEn = primitivas.creadaEn;
    return fila;
  }
}
