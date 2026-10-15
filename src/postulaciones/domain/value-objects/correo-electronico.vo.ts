import { errorDeDominio } from '../../../comun/domain/errors/error-codes';

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class CorreoElectronico {
  private constructor(private readonly direccion: string) {}

  static crear(entrada: string): CorreoElectronico {
    const limpio = (entrada ?? '').trim().toLowerCase();
    if (!REGEX_CORREO.test(limpio)) {
      throw errorDeDominio('CORREO_INVALIDO');
    }
    return new CorreoElectronico(limpio);
  }

  get valor(): string {
    return this.direccion;
  }

  equals(otro: CorreoElectronico): boolean {
    return this.direccion === otro.direccion;
  }
}
