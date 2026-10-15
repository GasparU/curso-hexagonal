import { Postulacion } from '../entities/postulacion.entity';
import { DocumentoIdentidad } from '../value-objects/documento-identidad.vo';
import { PostulacionId } from '../value-objects/postulacion-id.vo';
import { VacanteId } from '../value-objects/vacante-id.vo';

export interface PostulacionRepositorio {
  guardar(postulacion: Postulacion): Promise<void>;
  buscarPorId(id: PostulacionId): Promise<Postulacion | null>;
  existePorVacanteYDocumento(
    vacanteId: VacanteId,
    documento: DocumentoIdentidad,
  ): Promise<boolean>;
  listarPorVacante(vacanteId: VacanteId): Promise<Postulacion[]>;
}

export const POSTULACION_REPOSITORIO = Symbol('PostulacionRepositorio');
