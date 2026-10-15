import { SaldoCreditos } from '../../../domain/value-objects/saldo-creditos.vo';
import { SaldoCreditosOrmEntity } from '../orm/saldo-creditos.orm-entity';

export class SaldoCreditosMapper {
  static aDominio(fila: SaldoCreditosOrmEntity): SaldoCreditos {
    return SaldoCreditos.crear(fila.disponible);
  }

  static aPersistencia(saldo: SaldoCreditos, id: string): SaldoCreditosOrmEntity {
    const fila = new SaldoCreditosOrmEntity();
    fila.id = id;
    fila.disponible = saldo.valor;
    return fila;
  }
}
