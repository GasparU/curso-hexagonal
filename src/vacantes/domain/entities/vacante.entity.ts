import { errorDeDominio } from '../../../comun/domain/errors/error-codes';
import { Descripcion } from '../value-objects/descripcion.vo';
import { EstadoVacante } from '../value-objects/estado-vacante.vo';
import { PerfilCargo } from '../value-objects/perfil-cargo.vo';
import { SaldoCreditos } from '../value-objects/saldo-creditos.vo';
import { Titulo } from '../value-objects/titulo.vo';
import { VacanteId } from '../value-objects/vacante-id.vo';

/**
 * Raíz del agregado Vacante. No tiene setters: se cambia de estado con métodos
 * que representan reglas de negocio (`publicar`, `cerrar`).
 */
export class Vacante {
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

  /** Rehidrata desde la base. No re-aplica invariantes de creación (los datos ya son válidos). */
  static reconstruir(
    id: VacanteId,
    titulo: Titulo,
    descripcion: Descripcion,
    perfil: PerfilCargo,
    creadaEn: Date,
    estado: EstadoVacante,
    publicadaEn: Date | null,
    cerradaEn: Date | null,
    postulacionesRecibidas: number,
  ): Vacante {
    return new Vacante(
      id,
      titulo,
      descripcion,
      perfil,
      creadaEn,
      estado,
      publicadaEn,
      cerradaEn,
      postulacionesRecibidas,
    );
  }

  /**
   * Publicar CONSUME un crédito: la regla vive acá, no en el caso de uso.
   * Devuelve el saldo restante para que el handler lo persista.
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
