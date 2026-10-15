import { errorDeDominio } from '../../../comun/domain/errors/error-codes';

const MINIMO = 5;
const MAXIMO = 120;

export class Titulo {
  private constructor(private readonly texto: string) {}

  static crear(entrada: string): Titulo {
    const limpio = (entrada ?? '').trim();
    if (limpio.length < MINIMO || limpio.length > MAXIMO) {
      throw errorDeDominio('TITULO_INVALIDO');
    }
    return new Titulo(limpio);
  }

  get valor(): string {
    return this.texto;
  }

  equals(otro: Titulo): boolean {
    return this.texto === otro.texto;
  }
}
