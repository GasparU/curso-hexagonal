import { SaldoCreditos } from '../value-objects/saldo-creditos.vo';

export interface SaldoCreditosRepositorio {
  obtener(): Promise<SaldoCreditos | null>;
  guardar(saldo: SaldoCreditos): Promise<void>;
}

export const SALDO_CREDITOS_REPOSITORIO = Symbol('SaldoCreditosRepositorio');
