import { Vacante } from '../entities/vacante.entity';
import { Titulo } from '../value-objects/titulo.vo';
import { VacanteId } from '../value-objects/vacante-id.vo';

/**
 * Puerto de salida. El dominio dice qué necesita; la infraestructura resuelve cómo.
 * Si no encuentra algo devuelve `null`, no lanza excepción.
 */
export interface VacanteRepositorio {
  guardar(vacante: Vacante): Promise<void>;
  buscarPorId(id: VacanteId): Promise<Vacante | null>;
  existePorTitulo(titulo: Titulo): Promise<boolean>;
}

export const VACANTE_REPOSITORIO = Symbol('VacanteRepositorio');
