import { Vacante } from '../../../domain/entities/vacante.entity';
import { Descripcion } from '../../../domain/value-objects/descripcion.vo';
import { EstadoVacante } from '../../../domain/value-objects/estado-vacante.vo';
import { PerfilCargo } from '../../../domain/value-objects/perfil-cargo.vo';
import { Titulo } from '../../../domain/value-objects/titulo.vo';
import { VacanteId } from '../../../domain/value-objects/vacante-id.vo';
import { VacanteOrmEntity } from '../orm/vacante.orm-entity';

/** Traduce datos entre la fila del ORM y la entidad del dominio. No repite reglas del caso de uso. */
export class VacanteMapper {
  static aDominio(fila: VacanteOrmEntity): Vacante {
    return Vacante.reconstruir(
      VacanteId.desde(fila.id),
      Titulo.crear(fila.titulo),
      Descripcion.crear(fila.descripcion),
      PerfilCargo.crear(fila.perfilCargo),
      fila.creadaEn,
      EstadoVacante.crear(fila.estado),
      fila.publicadaEn,
      fila.cerradaEn,
      fila.postulacionesRecibidas,
    );
  }

  static aPersistencia(vacante: Vacante): VacanteOrmEntity {
    const fila = new VacanteOrmEntity();
    fila.id = vacante.id.valor;
    fila.titulo = vacante.titulo.valor;
    fila.descripcion = vacante.descripcion.valor;
    fila.perfilCargo = vacante.perfil.valor;
    fila.estado = vacante.estado.valor;
    fila.creadaEn = vacante.creadaEn;
    fila.publicadaEn = vacante.publicadaEn;
    fila.cerradaEn = vacante.cerradaEn;
    fila.postulacionesRecibidas = vacante.postulacionesRecibidas;
    return fila;
  }
}
