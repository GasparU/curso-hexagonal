import { errorDeDominio } from '../../../comun/domain/errors/error-codes';
import { EventoDeDominio } from '../../../comun/domain/evento-de-dominio';
import { VacanteCerrada } from '../events/vacante-cerrada.event';
import { VacantePublicada } from '../events/vacante-publicada.event';
import { Descripcion } from '../value-objects/descripcion.vo';
import { EstadoVacante } from '../value-objects/estado-vacante.vo';
import { PerfilCargo } from '../value-objects/perfil-cargo.vo';
import { SaldoCreditos } from '../value-objects/saldo-creditos.vo';
import { Titulo } from '../value-objects/titulo.vo';
import { VacanteId } from '../value-objects/vacante-id.vo';

/**
 * Forma plana de la vacante: es lo que entra y sale de la base, y lo que la
 * entidad deja ver hacia afuera.
 */
export interface VacantePrimitivas {
  id: string;
  titulo: string;
  descripcion: string;
  perfil: string;
  estado: string;
  creadaEn: Date;
  publicadaEn: Date | null;
  cerradaEn: Date | null;
  postulacionesRecibidas: number;
}

/**
 * Raíz del agregado Vacante. No tiene setters: se cambia de estado con métodos
 * que representan reglas de negocio (`publicar`, `cerrar`).
 *
 * Además guarda sus propios eventos: la entidad sabe cuándo pasó algo relevante
 * y el caso de uso los publica una vez que la guardó.
 */
export class Vacante {
  private readonly _eventos: EventoDeDominio[] = [];

  private constructor(
    readonly id: VacanteId,
    readonly titulo: Titulo,
    readonly descripcion: Descripcion,
    readonly perfil: PerfilCargo,
    readonly creadaEn: Date,
    private _estado: EstadoVacante,
    private _publicadaEn: Date | null,
    private _cerradaEn: Date | null,
    private _postulacionesRecibidas: number,
  ) {}

  /** Nace en BORRADOR y con cero postulaciones. */
  static crear(
    id: VacanteId,
    titulo: Titulo,
    descripcion: Descripcion,
    perfil: PerfilCargo,
    ahora: Date,
  ): Vacante {
    return new Vacante(
      id,
      titulo,
      descripcion,
      perfil,
      ahora,
      EstadoVacante.borrador(),
      null,
      null,
      0,
    );
  }

  /**
   * Rehidrata desde primitivos. Vuelve a validar: los value objects se arman
   * acá, así que un dato corrupto no llega a entrar.
   */
  static fromPrimitives(primitivas: VacantePrimitivas): Vacante {
    return new Vacante(
      VacanteId.desde(primitivas.id),
      Titulo.crear(primitivas.titulo),
      Descripcion.crear(primitivas.descripcion),
      PerfilCargo.crear(primitivas.perfil),
      primitivas.creadaEn,
      EstadoVacante.crear(primitivas.estado),
      primitivas.publicadaEn,
      primitivas.cerradaEn,
      primitivas.postulacionesRecibidas,
    );
  }

  /** Devuelve la vacante como primitivos. */
  toPrimitives(): VacantePrimitivas {
    return {
      id: this.id.valor,
      titulo: this.titulo.valor,
      descripcion: this.descripcion.valor,
      perfil: this.perfil.valor,
      estado: this._estado.valor,
      creadaEn: this.creadaEn,
      publicadaEn: this._publicadaEn,
      cerradaEn: this._cerradaEn,
      postulacionesRecibidas: this._postulacionesRecibidas,
    };
  }

  /**
   * Publicar consume un crédito: la regla vive acá, no en el caso de uso.
   * Devuelve el saldo restante para que el handler lo guarde.
   */
  publicar(saldo: SaldoCreditos, ahora: Date): SaldoCreditos {
    if (this._estado.esCerrada()) {
      throw errorDeDominio('VACANTE_YA_CERRADA');
    }
    if (this._estado.esPublicada()) {
      throw errorDeDominio('VACANTE_YA_PUBLICADA');
    }

    const saldoRestante = saldo.descontar();
    this._estado = EstadoVacante.publicada();
    this._publicadaEn = ahora;
    this._eventos.push(new VacantePublicada(this.id.valor, ahora));
    return saldoRestante;
  }

  /** Lo llama el listener cuando llega una postulación del otro contexto. */
  registrarPostulacion(): void {
    this._postulacionesRecibidas += 1;
  }

  /** Cerrar no borra: solo cambia de estado, y no se vuelve atrás. */
  cerrar(ahora: Date): void {
    if (this._estado.esCerrada()) {
      throw errorDeDominio('VACANTE_YA_CERRADA');
    }
    if (!this._estado.esPublicada()) {
      throw errorDeDominio('VACANTE_NO_PUBLICADA');
    }

    this._estado = EstadoVacante.cerrada();
    this._cerradaEn = ahora;
    this._eventos.push(new VacanteCerrada(this.id.valor, ahora));
  }

  /** Devuelve los eventos pendientes y los limpia. */
  tomarEventos(): EventoDeDominio[] {
    const eventos = [...this._eventos];
    this._eventos.length = 0;
    return eventos;
  }

  get estado(): EstadoVacante {
    return this._estado;
  }

  get publicadaEn(): Date | null {
    return this._publicadaEn;
  }

  get cerradaEn(): Date | null {
    return this._cerradaEn;
  }

  get postulacionesRecibidas(): number {
    return this._postulacionesRecibidas;
  }
}
