import { EventoDeDominio } from '../../../comun/domain/evento-de-dominio';
import { PostulacionEnviada } from '../events/postulacion-enviada.event';
import { CorreoElectronico } from '../value-objects/correo-electronico.vo';
import { DocumentoIdentidad } from '../value-objects/documento-identidad.vo';
import { EstadoPostulacion } from '../value-objects/estado-postulacion.vo';
import { NombreCompleto } from '../value-objects/nombre-completo.vo';
import { PostulacionId } from '../value-objects/postulacion-id.vo';
import { VacanteId } from '../value-objects/vacante-id.vo';

/** Forma plana de la postulación: lo que entra y sale de la base. */
export interface PostulacionPrimitivas {
  id: string;
  vacanteId: string;
  nombreCompleto: string;
  documentoIdentidad: string;
  correo: string;
  estado: string;
  creadaEn: Date;
}

/**
 * Raíz del agregado Postulacion. Inmutable: todavía no tiene cambios de estado.
 *
 * Guarda su propio evento para que el caso de uso lo publique una vez que la
 * haya guardado.
 */
export class Postulacion {
  private readonly _eventos: EventoDeDominio[] = [];

  private constructor(
    readonly id: PostulacionId,
    readonly vacanteId: VacanteId,
    readonly nombreCompleto: NombreCompleto,
    readonly documentoIdentidad: DocumentoIdentidad,
    readonly correo: CorreoElectronico,
    readonly estado: EstadoPostulacion,
    readonly creadaEn: Date,
  ) {}

  /** Nace en RECIBIDA y deja su evento listo para publicar. */
  static registrar(
    id: PostulacionId,
    vacanteId: VacanteId,
    nombreCompleto: NombreCompleto,
    documentoIdentidad: DocumentoIdentidad,
    correo: CorreoElectronico,
    ahora: Date,
  ): Postulacion {
    const postulacion = new Postulacion(
      id,
      vacanteId,
      nombreCompleto,
      documentoIdentidad,
      correo,
      EstadoPostulacion.recibida(),
      ahora,
    );

    postulacion._eventos.push(
      new PostulacionEnviada(postulacion.id.valor, vacanteId.valor, ahora),
    );
    return postulacion;
  }

  /**
   * Rehidrata desde primitivos. Vuelve a validar: los value objects se arman
   * acá, así que un dato corrupto no llega a entrar.
   */
  static fromPrimitives(primitivas: PostulacionPrimitivas): Postulacion {
    return new Postulacion(
      PostulacionId.desde(primitivas.id),
      VacanteId.desde(primitivas.vacanteId),
      NombreCompleto.crear(primitivas.nombreCompleto),
      DocumentoIdentidad.crear(primitivas.documentoIdentidad),
      CorreoElectronico.crear(primitivas.correo),
      EstadoPostulacion.crear(primitivas.estado),
      primitivas.creadaEn,
    );
  }

  /** Devuelve la postulación como primitivos. */
  toPrimitives(): PostulacionPrimitivas {
    return {
      id: this.id.valor,
      vacanteId: this.vacanteId.valor,
      nombreCompleto: this.nombreCompleto.valor,
      documentoIdentidad: this.documentoIdentidad.valor,
      correo: this.correo.valor,
      estado: this.estado.valor,
      creadaEn: this.creadaEn,
    };
  }

  /** Devuelve los eventos pendientes y los limpia. */
  tomarEventos(): EventoDeDominio[] {
    const eventos = [...this._eventos];
    this._eventos.length = 0;
    return eventos;
  }
}
