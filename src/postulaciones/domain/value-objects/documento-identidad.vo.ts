import { errorDeDominio } from '../../../comun/domain/errors/error-codes';

const REGEX_DNI = /^\d{8}$/;

export class DocumentoIdentidad {
  private constructor(private readonly numero: string) {}

  static crear(entrada: string): DocumentoIdentidad {
    const limpio = (entrada ?? '').trim();
    if (!REGEX_DNI.test(limpio)) {
      throw errorDeDominio('DNI_INVALIDO');
    }
    return new DocumentoIdentidad(limpio);
  }

  get valor(): string {
    return this.numero;
  }

  equals(otro: DocumentoIdentidad): boolean {
    return this.numero === otro.numero;
  }
}
