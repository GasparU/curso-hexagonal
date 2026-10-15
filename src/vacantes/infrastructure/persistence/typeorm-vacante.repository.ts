import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vacante } from '../../domain/entities/vacante.entity';
import { VacanteRepositorio } from '../../domain/ports/vacante.repository';
import { Titulo } from '../../domain/value-objects/titulo.vo';
import { VacanteId } from '../../domain/value-objects/vacante-id.vo';
import { VacanteMapper } from './mappers/vacante.mapper';
import { VacanteOrmEntity } from './orm/vacante.orm-entity';

@Injectable()
export class TypeOrmVacanteRepositorio implements VacanteRepositorio {
  constructor(
    @InjectRepository(VacanteOrmEntity)
    private readonly repositorio: Repository<VacanteOrmEntity>,
  ) {}

  async guardar(vacante: Vacante): Promise<void> {
    await this.repositorio.save(VacanteMapper.aPersistencia(vacante));
  }

  async buscarPorId(id: VacanteId): Promise<Vacante | null> {
    const fila = await this.repositorio.findOne({ where: { id: id.valor } });
    return fila ? VacanteMapper.aDominio(fila) : null;
  }

  async existePorTitulo(titulo: Titulo): Promise<boolean> {
    const fila = await this.repositorio.findOne({ where: { titulo: titulo.valor } });
    return fila !== null;
  }
}
