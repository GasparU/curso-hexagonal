import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  SaldoCreditosRepositorio,
} from '../../domain/ports/saldo-creditos.repository';
import { SaldoCreditos } from '../../domain/value-objects/saldo-creditos.vo';
import { SaldoCreditosMapper } from './mappers/saldo-creditos.mapper';
import { SaldoCreditosOrmEntity } from './orm/saldo-creditos.orm-entity';

/** Id fijo de la fila única del saldo (es un singleton, no una colección). */
export const ID_SALDO_UNICO = '00000000-0000-4000-8000-000000000001';

@Injectable()
export class TypeOrmSaldoCreditosRepositorio implements SaldoCreditosRepositorio {
  constructor(
    @InjectRepository(SaldoCreditosOrmEntity)
    private readonly repositorio: Repository<SaldoCreditosOrmEntity>,
  ) {}

  async obtener(): Promise<SaldoCreditos | null> {
    const filas = await this.repositorio.find({ take: 1 });
    return filas.length > 0 ? SaldoCreditosMapper.aDominio(filas[0]) : null;
  }

  async guardar(saldo: SaldoCreditos): Promise<void> {
    await this.repositorio.save(SaldoCreditosMapper.aPersistencia(saldo, ID_SALDO_UNICO));
  }
}
