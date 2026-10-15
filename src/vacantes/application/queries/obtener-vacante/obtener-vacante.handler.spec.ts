import { Vacante } from '../../../domain/entities/vacante.entity';
import { Descripcion } from '../../../domain/value-objects/descripcion.vo';
import { PerfilCargo } from '../../../domain/value-objects/perfil-cargo.vo';
import { Titulo } from '../../../domain/value-objects/titulo.vo';
import { VacanteId } from '../../../domain/value-objects/vacante-id.vo';
import { VacanteRepositorioEnMemoria } from '../../../infrastructure/persistence/en-memoria/vacante.repository.en-memoria';
import { ObtenerVacanteHandler } from './obtener-vacante.handler';
import { ObtenerVacanteQuery } from './obtener-vacante.query';

const ID = '11111111-1111-4111-8111-111111111111';
const AHORA = new Date('2026-01-01T00:00:00Z');

describe('ObtenerVacanteHandler', () => {
  it('devuelve la vista de la vacante', async () => {
    const repositorio = new VacanteRepositorioEnMemoria();
    await repositorio.guardar(
      Vacante.crear(
        VacanteId.desde(ID),
        Titulo.crear('Analista de datos'),
        Descripcion.crear('Buscamos un analista con experiencia en SQL.'),
        PerfilCargo.profesional(),
        AHORA,
      ),
    );
    const handler = new ObtenerVacanteHandler(repositorio);

    const vista = await handler.execute(new ObtenerVacanteQuery(ID));

    expect(vista.id).toBe(ID);
    expect(vista.titulo).toBe('Analista de datos');
    expect(vista.estado).toBe('BORRADOR');
    expect(vista.publicadaEn).toBeNull();
    expect(vista.postulacionesRecibidas).toBe(0);
  });

  it('falla con NOT_FOUND si no existe', async () => {
    const handler = new ObtenerVacanteHandler(new VacanteRepositorioEnMemoria());

    await expect(handler.execute(new ObtenerVacanteQuery(ID))).rejects.toThrow(
      'No se encontró la vacante indicada.',
    );
  });
});
