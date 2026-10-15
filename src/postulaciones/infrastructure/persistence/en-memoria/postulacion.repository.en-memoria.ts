import { Postulacion } from '../../../domain/entities/postulacion.entity';
import { PostulacionRepositorio } from '../../../domain/ports/postulacion.repository';
import { DocumentoIdentidad } from '../../../domain/value-objects/documento-identidad.vo';
import { PostulacionId } from '../../../domain/value-objects/postulacion-id.vo';
import { VacanteId } from '../../../domain/value-objects/vacante-id.vo';

/** Adaptador EN MEMORIA para los tests unitarios (sin Nest y sin base). */
export class PostulacionRepositorioEnMemoria implements PostulacionRepositorio {
  private readonly porId = new Map<string, Postulacion>();

  async guardar(postulacion: Postulacion): Promise<void> {
    this.porId.set(postulacion.id.valor, postulacion);
  }

  async buscarPorId(id: PostulacionId): Promise<Postulacion | null> {
    return this.porId.get(id.valor) ?? null;
  }

  async existePorVacanteYDocumento(
    vacanteId: VacanteId,
    documento: DocumentoIdentidad,
  ): Promise<boolean> {
    return [...this.porId.values()].some(
      (postulacion) =>
        postulacion.vacanteId.equals(vacanteId) &&
        postulacion.documentoIdentidad.equals(documento),
    );
  }

  async listarPorVacante(vacanteId: VacanteId): Promise<Postulacion[]> {
    return [...this.porId.values()]
      .filter((postulacion) => postulacion.vacanteId.equals(vacanteId))
      .sort((a, b) => a.creadaEn.getTime() - b.creadaEn.getTime());
  }

  /** Atajo solo para tests. */
  cantidad(): number {
    return this.porId.size;
  }
}
