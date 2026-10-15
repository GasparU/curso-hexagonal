import { Vacante } from '../../../domain/entities/vacante.entity';
import { VacanteRepositorio } from '../../../domain/ports/vacante.repository';
import { Titulo } from '../../../domain/value-objects/titulo.vo';
import { VacanteId } from '../../../domain/value-objects/vacante-id.vo';

/**
 * Adaptador EN MEMORIA para los tests unitarios: sin Nest y sin base.
 * Es el que permite instanciar los handlers "a mano".
 */
export class VacanteRepositorioEnMemoria implements VacanteRepositorio {
  private readonly porId = new Map<string, Vacante>();

  async guardar(vacante: Vacante): Promise<void> {
    this.porId.set(vacante.id.valor, vacante);
  }

  async buscarPorId(id: VacanteId): Promise<Vacante | null> {
    return this.porId.get(id.valor) ?? null;
  }

  async existePorTitulo(titulo: Titulo): Promise<boolean> {
    return [...this.porId.values()].some((vacante) => vacante.titulo.equals(titulo));
  }

  /** Atajo solo para tests. */
  cantidad(): number {
    return this.porId.size;
  }
}
