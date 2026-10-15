import { EventoDeDominio } from '../../../comun/domain/evento-de-dominio';
import { PostulacionEnviada } from '../events/postulacion-enviada.event';
import { CorreoElectronico } from '../value-objects/correo-electronico.vo';
import { DocumentoIdentidad } from '../value-objects/documento-identidad.vo';
import { EstadoPostulacion } from '../value-objects/estado-postulacion.vo';
import { NombreCompleto } from '../value-objects/nombre-completo.vo';
import { PostulacionId } from '../value-objects/postulacion-id.vo';
import { VacanteId } from '../value-objects/vacante-id.vo';

/** Forma PLANA de la postulación: la frontera del agregado hacia la base. */
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
 * Raíz del agregado Postulacion. Inmutable: no hay setters ni cambios de estado
 * todavía (el workflow de estados queda para después del curso).
 *
 * Registra su propio evento: al nacer sabe que hay que avisar que se postuló a
 * una vacante. El caso de uso lo publica DESPUÉS de persistir (§8).
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

  /** Nace en RECIBIDA y registra el evento para que el otro contexto se entere. */
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
   * Rehidrata desde primitivos (lo que devuelve la base). VUELVE A VALIDAR:
   * los value objects se construyen acá, así que un dato corrupto no entra.
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

  /** Todo lo que la postulación deja ver afuera: primitivos. */
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

  /** Entrega los eventos registrados y los limpia: se publican una sola vez. */
  tomarEventos(): EventoDeDominio[] {
    const eventos = [...this._eventos];
    this._eventos.length = 0;
    return eventos;
  }
}
