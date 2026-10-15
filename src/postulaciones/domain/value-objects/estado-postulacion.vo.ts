import { errorDeDominio } from '../../../comun/domain/errors/error-codes';

export const ESTADOS_POSTULACION = ['RECIBIDA', 'EN_REVISION', 'RECHAZADA', 'CONTRATADA'] as const;
export type EstadoPostulacionValor = (typeof ESTADOS_POSTULACION)[number];

export class EstadoPostulacion {
  private constructor(private readonly estado: EstadoPostulacionValor) {}

  static crear(entrada: string): EstadoPostulacion {
    const normalizado = (entrada ?? '').trim().toUpperCase();
    if (!ESTADOS_POSTULACION.includes(normalizado as EstadoPostulacionValor)) {
      throw errorDeDominio('ESTADO_INVALIDO');
    }
    return new EstadoPostulacion(normalizado as EstadoPostulacionValor);
  }

  static recibida(): EstadoPostulacion {
    return new EstadoPostulacion('RECIBIDA');
  }

  get valor(): EstadoPostulacionValor {
    return this.estado;
  }

  equals(otro: EstadoPostulacion): boolean {
    return this.estado === otro.estado;
  }
}
