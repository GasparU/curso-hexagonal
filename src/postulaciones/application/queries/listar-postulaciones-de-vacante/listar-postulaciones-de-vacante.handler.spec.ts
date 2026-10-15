import { Postulacion } from '../../../domain/entities/postulacion.entity';
import { ConsultaDeVacantes } from '../../../domain/ports/consulta-de-vacantes.port';
import { CorreoElectronico } from '../../../domain/value-objects/correo-electronico.vo';
import { DocumentoIdentidad } from '../../../domain/value-objects/documento-identidad.vo';
import { NombreCompleto } from '../../../domain/value-objects/nombre-completo.vo';
import { PostulacionId } from '../../../domain/value-objects/postulacion-id.vo';
import { VacanteId } from '../../../domain/value-objects/vacante-id.vo';
import { PostulacionRepositorioEnMemoria } from '../../../infrastructure/persistence/en-memoria/postulacion.repository.en-memoria';
import { ListarPostulacionesDeVacanteHandler } from './listar-postulaciones-de-vacante.handler';
import { ListarPostulacionesDeVacanteQuery } from './listar-postulaciones-de-vacante.query';

const VACANTE_ID = '11111111-1111-4111-8111-111111111111';
const OTRA_VACANTE_ID = '33333333-3333-4333-8333-333333333333';
const AHORA = new Date('2026-02-01T10:00:00Z');

class ConsultaDeVacantesFalsa implements ConsultaDeVacantes {
  constructor(private readonly existentes: string[]) {}
  async existe(vacanteId: VacanteId): Promise<boolean> {
    return this.existentes.includes(vacanteId.valor);
  }
}

function postulacion(id: string, vacanteId: string): Postulacion {
  return Postulacion.registrar(
    PostulacionId.desde(id),
    VacanteId.desde(vacanteId),
    NombreCompleto.crear('Ana Pérez'),
    DocumentoIdentidad.crear('12345678'),
    CorreoElectronico.crear('ana@correo.com'),
    AHORA,
  );
}

describe('ListarPostulacionesDeVacanteHandler', () => {
  it('devuelve SOLO las postulaciones de la vacante pedida', async () => {
    const repositorio = new PostulacionRepositorioEnMemoria();
    await repositorio.guardar(postulacion('22222222-2222-4222-8222-222222222222', VACANTE_ID));
    await repositorio.guardar(postulacion('44444444-4444-4444-8444-444444444444', OTRA_VACANTE_ID));

    const handler = new ListarPostulacionesDeVacanteHandler(
      repositorio,
      new ConsultaDeVacantesFalsa([VACANTE_ID, OTRA_VACANTE_ID]),
    );

    const vistas = await handler.execute(new ListarPostulacionesDeVacanteQuery(VACANTE_ID));

    expect(vistas).toHaveLength(1);
    expect(vistas[0].vacanteId).toBe(VACANTE_ID);
    expect(vistas[0].documentoIdentidad).toBe('12345678');
  });

  it('falla con NOT_FOUND si la vacante no existe', async () => {
    const handler = new ListarPostulacionesDeVacanteHandler(
      new PostulacionRepositorioEnMemoria(),
      new ConsultaDeVacantesFalsa([]),
    );

    await expect(
      handler.execute(new ListarPostulacionesDeVacanteQuery(VACANTE_ID)),
    ).rejects.toThrow('No se encontró la vacante indicada.');
  });
});
