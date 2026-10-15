import { CorreoElectronico } from '../value-objects/correo-electronico.vo';
import { DocumentoIdentidad } from '../value-objects/documento-identidad.vo';
import { EstadoPostulacion } from '../value-objects/estado-postulacion.vo';
import { NombreCompleto } from '../value-objects/nombre-completo.vo';
import { PostulacionId } from '../value-objects/postulacion-id.vo';
import { VacanteId } from '../value-objects/vacante-id.vo';

/**
 * Raíz del agregado Postulacion. Inmutable: no hay setters ni cambios de estado
 * todavía (el workflow de estados queda para después del curso).
 */
export class Postulacion {
  private constructor(
    readonly id: PostulacionId,
    readonly vacanteId: VacanteId,
    readonly nombreCompleto: NombreCompleto,
    readonly documentoIdentidad: DocumentoIdentidad,
    readonly correo: CorreoElectronico,
    readonly estado: EstadoPostulacion,
    readonly creadaEn: Date,
  ) {}

  /** Nace en RECIBIDA. */
  static registrar(
    id: PostulacionId,
    vacanteId: VacanteId,
    nombreCompleto: NombreCompleto,
    documentoIdentidad: DocumentoIdentidad,
    correo: CorreoElectronico,
    ahora: Date,
  ): Postulacion {
    return new Postulacion(
      id,
      vacanteId,
      nombreCompleto,
      documentoIdentidad,
      correo,
      EstadoPostulacion.recibida(),
      ahora,
    );
  }

  /** Rehidrata desde la base. */
  static reconstruir(
    id: PostulacionId,
    vacanteId: VacanteId,
    nombreCompleto: NombreCompleto,
    documentoIdentidad: DocumentoIdentidad,
    correo: CorreoElectronico,
    estado: EstadoPostulacion,
    creadaEn: Date,
  ): Postulacion {
    return new Postulacion(
      id,
      vacanteId,
      nombreCompleto,
      documentoIdentidad,
      correo,
      estado,
      creadaEn,
    );
  }
}
