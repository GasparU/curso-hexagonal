import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Postulacion } from '../../domain/entities/postulacion.entity';
import { PostulacionRepositorio } from '../../domain/ports/postulacion.repository';
import { DocumentoIdentidad } from '../../domain/value-objects/documento-identidad.vo';
import { PostulacionId } from '../../domain/value-objects/postulacion-id.vo';
import { VacanteId } from '../../domain/value-objects/vacante-id.vo';
import { PostulacionMapper } from './mappers/postulacion.mapper';
import { PostulacionOrmEntity } from './orm/postulacion.orm-entity';

@Injectable()
export class TypeOrmPostulacionRepositorio implements PostulacionRepositorio {
  constructor(
    @InjectRepository(PostulacionOrmEntity)
    private readonly repositorio: Repository<PostulacionOrmEntity>,
  ) {}

  async guardar(postulacion: Postulacion): Promise<void> {
    await this.repositorio.save(PostulacionMapper.aPersistencia(postulacion));
  }

  async buscarPorId(id: PostulacionId): Promise<Postulacion | null> {
    const fila = await this.repositorio.findOne({ where: { id: id.valor } });
    return fila ? PostulacionMapper.aDominio(fila) : null;
  }

  async existePorVacanteYDocumento(
    vacanteId: VacanteId,
    documento: DocumentoIdentidad,
  ): Promise<boolean> {
    const fila = await this.repositorio.findOne({
      where: { vacanteId: vacanteId.valor, documentoIdentidad: documento.valor },
    });
    return fila !== null;
  }

  async listarPorVacante(vacanteId: VacanteId): Promise<Postulacion[]> {
    const filas = await this.repositorio.find({
      where: { vacanteId: vacanteId.valor },
      order: { creadaEn: 'ASC' },
    });
    return filas.map((fila) => PostulacionMapper.aDominio(fila));
  }
}
