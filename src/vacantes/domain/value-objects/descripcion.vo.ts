import { errorDeDominio } from '../errors/error-codes';

const MINIMO = 20;

export class Descripcion {
  private constructor(private readonly texto: string) {}

  static crear(entrada: string): Descripcion {
    const limpio = (entrada ?? '').trim();
    if (limpio.length < MINIMO) {
      throw errorDeDominio('DESCRIPCION_MUY_CORTA');
    }
    return new Descripcion(limpio);
  }

  get valor(): string {
    return this.texto;
  }

  equals(otro: Descripcion): boolean {
    return this.texto === otro.texto;
  }
}
