import { errorDeDominio } from '../errors/error-codes';

export class SaldoCreditos {
  private constructor(private readonly cantidad: number) {}

  static crear(cantidad: number): SaldoCreditos {
    if (!Number.isInteger(cantidad) || cantidad < 0) {
      throw errorDeDominio('SALDO_INVALIDO');
    }
    return new SaldoCreditos(cantidad);
  }

  static cero(): SaldoCreditos {
    return new SaldoCreditos(0);
  }

  descontar(cantidad = 1): SaldoCreditos {
    if (this.cantidad < cantidad) {
      throw errorDeDominio('CREDITOS_INSUFICIENTES');
    }
    return new SaldoCreditos(this.cantidad - cantidad);
  }

  alcanzaPara(cantidad = 1): boolean {
    return this.cantidad >= cantidad;
  }

  get valor(): number {
    return this.cantidad;
  }

  equals(otro: SaldoCreditos): boolean {
    return this.cantidad === otro.cantidad;
  }
}
