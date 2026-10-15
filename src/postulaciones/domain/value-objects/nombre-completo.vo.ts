import { errorDeDominio } from '../../../comun/domain/errors/error-codes';

const MINIMO = 3;
const MAXIMO = 120;

export class NombreCompleto {
  private constructor(private readonly texto: string) {}

  static crear(entrada: string): NombreCompleto {
    const limpio = (entrada ?? '').trim();
    if (limpio.length < MINIMO || limpio.length > MAXIMO) {
      throw errorDeDominio('NOMBRE_INVALIDO');
    }
    return new NombreCompleto(limpio);
  }

  get valor(): string {
    return this.texto;
  }

  equals(otro: NombreCompleto): boolean {
    return this.texto === otro.texto;
  }
}
