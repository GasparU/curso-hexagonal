import { VacanteRepositorioEnMemoria } from '../../../infrastructure/persistence/en-memoria/vacante.repository.en-memoria';
import { VacanteId } from '../../../domain/value-objects/vacante-id.vo';
import { CrearVacanteCommand } from './crear-vacante.command';
import { CrearVacanteHandler } from './crear-vacante.handler';

const ID_FIJO = '11111111-1111-4111-8111-111111111111';
const AHORA = new Date('2026-01-01T00:00:00Z');

function crearHandler(repositorio: VacanteRepositorioEnMemoria): CrearVacanteHandler {
  return new CrearVacanteHandler(
    repositorio,
    { generar: () => ID_FIJO },
    { ahora: () => AHORA },
  );
}

describe('CrearVacanteHandler', () => {
  it('persiste la vacante y devuelve su id', async () => {
    const repositorio = new VacanteRepositorioEnMemoria();
    const handler = crearHandler(repositorio);

    const id = await handler.execute(
      new CrearVacanteCommand(
        'Analista de datos',
        'Buscamos un analista con experiencia en SQL.',
        'PROFESIONAL',
      ),
    );

    expect(id).toBe(ID_FIJO);
    expect(repositorio.cantidad()).toBe(1);

    const guardada = await repositorio.buscarPorId(VacanteId.desde(ID_FIJO));
    expect(guardada?.titulo.valor).toBe('Analista de datos');
    expect(guardada?.estado.valor).toBe('BORRADOR');
  });

  it('propaga el error de dominio si el título es inválido (no persiste nada)', async () => {
    const repositorio = new VacanteRepositorioEnMemoria();
    const handler = crearHandler(repositorio);

    await expect(
      handler.execute(new CrearVacanteCommand('abc', 'Buscamos un analista con experiencia.', 'PROFESIONAL')),
    ).rejects.toThrow('El título debe tener entre 5 y 120 caracteres.');

    expect(repositorio.cantidad()).toBe(0);
  });
});
