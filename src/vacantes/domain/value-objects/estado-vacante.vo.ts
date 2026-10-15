import { errorDeDominio } from '../../../comun/domain/errors/error-codes';

export const ESTADOS_VACANTE = ['BORRADOR', 'PUBLICADA', 'CERRADA'] as const;
export type EstadoVacanteValor = (typeof ESTADOS_VACANTE)[number];

export class EstadoVacante {
  private constructor(private readonly estado: EstadoVacanteValor) {}

  static crear(entrada: string): EstadoVacante {
    const normalizado = (entrada ?? '').trim().toUpperCase();
    if (!ESTADOS_VACANTE.includes(normalizado as EstadoVacanteValor)) {
      throw errorDeDominio('ESTADO_INVALIDO');
    }
    return new EstadoVacante(normalizado as EstadoVacanteValor);
  }

  static borrador(): EstadoVacante {
    return new EstadoVacante('BORRADOR');
  }

  static publicada(): EstadoVacante {
    return new EstadoVacante('PUBLICADA');
  }

  static cerrada(): EstadoVacante {
    return new EstadoVacante('CERRADA');
  }

  get valor(): EstadoVacanteValor {
    return this.estado;
  }

  esBorrador(): boolean {
    return this.estado === 'BORRADOR';
  }

  esPublicada(): boolean {
    return this.estado === 'PUBLICADA';
  }

  esCerrada(): boolean {
    return this.estado === 'CERRADA';
  }

  equals(otro: EstadoVacante): boolean {
    return this.estado === otro.estado;
  }
}
