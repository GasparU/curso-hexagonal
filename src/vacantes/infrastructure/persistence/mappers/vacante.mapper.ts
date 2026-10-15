import { Vacante } from '../../../domain/entities/vacante.entity';
import { VacanteOrmEntity } from '../orm/vacante.orm-entity';

/**
 * Traduce datos entre la fila del ORM y la entidad del dominio, EN LOS DOS
 * SENTIDOS, usando primitivos (`toPrimitives` / `fromPrimitives`).
 * No repite reglas del caso de uso.
 */
export class VacanteMapper {
  static aDominio(fila: VacanteOrmEntity): Vacante {
    return Vacante.fromPrimitives({
      id: fila.id,
      titulo: fila.titulo,
      descripcion: fila.descripcion,
      perfil: fila.perfilCargo,
      estado: fila.estado,
      creadaEn: fila.creadaEn,
      publicadaEn: fila.publicadaEn,
      cerradaEn: fila.cerradaEn,
      postulacionesRecibidas: fila.postulacionesRecibidas,
    });
  }

  static aPersistencia(vacante: Vacante): VacanteOrmEntity {
    const primitivas = vacante.toPrimitives();

    const fila = new VacanteOrmEntity();
    fila.id = primitivas.id;
    fila.titulo = primitivas.titulo;
    fila.descripcion = primitivas.descripcion;
    fila.perfilCargo = primitivas.perfil;
    fila.estado = primitivas.estado;
    fila.creadaEn = primitivas.creadaEn;
    fila.publicadaEn = primitivas.publicadaEn;
    fila.cerradaEn = primitivas.cerradaEn;
    fila.postulacionesRecibidas = primitivas.postulacionesRecibidas;
    return fila;
  }
}
