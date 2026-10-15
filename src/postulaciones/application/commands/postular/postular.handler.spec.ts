import { EventoDeDominio } from '../../../../comun/domain/evento-de-dominio';
import { PublicadorDeEventos } from '../../../../comun/domain/ports/publicador-eventos.port';
import { PostulacionEnviada } from '../../../domain/events/postulacion-enviada.event';
import { ConsultaDeVacantes } from '../../../domain/ports/consulta-de-vacantes.port';
import { VacanteId } from '../../../domain/value-objects/vacante-id.vo';
import { PostulacionRepositorioEnMemoria } from '../../../infrastructure/persistence/en-memoria/postulacion.repository.en-memoria';
import { PostularCommand } from './postular.command';
import { PostularHandler } from './postular.handler';

const VACANTE_ID = '11111111-1111-4111-8111-111111111111';
const POSTULACION_ID = '22222222-2222-4222-8222-222222222222';
const AHORA = new Date('2026-02-01T10:00:00Z');

class ConsultaDeVacantesFalsa implements ConsultaDeVacantes {
  constructor(private readonly existentes: string[]) {}
  async existe(vacanteId: VacanteId): Promise<boolean> {
    return this.existentes.includes(vacanteId.valor);
  }
}

class PublicadorEspia implements PublicadorDeEventos {
  readonly publicados: EventoDeDominio[] = [];
  postulacionesAlPublicar: number | null = null;

  constructor(private readonly postulaciones: PostulacionRepositorioEnMemoria) {}

  async publicar(eventos: EventoDeDominio[]): Promise<void> {
    // cuántas postulaciones había guardadas en el momento de publicar el evento
    this.postulacionesAlPublicar = this.postulaciones.cantidad();
    this.publicados.push(...eventos);
  }
}

function armar(vacanteExiste: boolean) {
  const postulaciones = new PostulacionRepositorioEnMemoria();
  const publicador = new PublicadorEspia(postulaciones);
  const handler = new PostularHandler(
    postulaciones,
    new ConsultaDeVacantesFalsa(vacanteExiste ? [VACANTE_ID] : []),
    { generar: () => POSTULACION_ID },
    { ahora: () => AHORA },
    publicador,
  );
  return { postulaciones, publicador, handler };
}

const comandoValido = () =>
  new PostularCommand(VACANTE_ID, 'Ana Pérez', '12345678', 'ana@correo.com');

describe('PostularHandler', () => {
  it('persiste la postulación y publica PostulacionEnviada', async () => {
    const { postulaciones, publicador, handler } = armar(true);

    const id = await handler.execute(comandoValido());

    expect(id).toBe(POSTULACION_ID);
    expect(postulaciones.cantidad()).toBe(1);
    expect(publicador.publicados).toHaveLength(1);
    expect(publicador.publicados[0]).toBeInstanceOf(PostulacionEnviada);
    expect((publicador.publicados[0] as PostulacionEnviada).vacanteId).toBe(VACANTE_ID);
    // el evento se publica DESPUÉS de persistir (§8): ya estaba guardada
    expect(publicador.postulacionesAlPublicar).toBe(1);
  });

  it('falla con NOT_FOUND si la vacante no existe (y no persiste nada)', async () => {
    const { postulaciones, publicador, handler } = armar(false);

    await expect(handler.execute(comandoValido())).rejects.toThrow(
      'No se encontró la vacante indicada.',
    );

    expect(postulaciones.cantidad()).toBe(0);
    expect(publicador.publicados).toHaveLength(0);
  });

  it('falla con CONFLICT si el mismo DNI ya se postuló a esa vacante', async () => {
    const { postulaciones, publicador, handler } = armar(true);

    await handler.execute(comandoValido());

    await expect(handler.execute(comandoValido())).rejects.toThrow(
      'El postulante ya se postuló a esta vacante.',
    );

    expect(postulaciones.cantidad()).toBe(1);
    expect(publicador.publicados).toHaveLength(1); // el evento se emitió una sola vez
  });

  it('propaga el error de dominio si el DNI es inválido', async () => {
    const { postulaciones, handler } = armar(true);

    await expect(
      handler.execute(new PostularCommand(VACANTE_ID, 'Ana Pérez', '1234', 'ana@correo.com')),
    ).rejects.toThrow('El DNI debe tener exactamente 8 dígitos.');

    expect(postulaciones.cantidad()).toBe(0);
  });
});
