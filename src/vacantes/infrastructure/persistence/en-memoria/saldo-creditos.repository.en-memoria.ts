import { SaldoCreditosRepositorio } from '../../../domain/ports/saldo-creditos.repository';
import { SaldoCreditos } from '../../../domain/value-objects/saldo-creditos.vo';

export class SaldoCreditosRepositorioEnMemoria implements SaldoCreditosRepositorio {
  constructor(private saldo: SaldoCreditos | null = null) {}

  async obtener(): Promise<SaldoCreditos | null> {
    return this.saldo;
  }

  async guardar(saldo: SaldoCreditos): Promise<void> {
    this.saldo = saldo;
  }
}
