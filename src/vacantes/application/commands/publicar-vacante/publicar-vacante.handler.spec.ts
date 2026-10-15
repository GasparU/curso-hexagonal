import { Vacante } from '../../../domain/entities/vacante.entity';
import { EventoDeDominio } from '../../../domain/events/evento-de-dominio';
import { VacantePublicada } from '../../../domain/events/vacante-publicada.event';
import { PublicadorDeEventos } from '../../../domain/ports/publicador-eventos.port';
import { Descripcion } from '../../../domain/value-objects/descripcion.vo';
import { PerfilCargo } from '../../../domain/value-objects/perfil-cargo.vo';
import { SaldoCreditos } from '../../../domain/value-objects/saldo-creditos.vo';
import { Titulo } from '../../../domain/value-objects/titulo.vo';
import { VacanteId } from '../../../domain/value-objects/vacante-id.vo';
import { SaldoCreditosRepositorioEnMemoria } from '../../../infrastructure/persistence/en-memoria/saldo-creditos.repository.en-memoria';
import { VacanteRepositorioEnMemoria } from '../../../infrastructure/persistence/en-memoria/vacante.repository.en-memoria';
import { PublicarVacanteCommand } from './publicar-vacante.command';
import { PublicarVacanteHandler } from './publicar-vacante.handler';

const ID = '11111111-1111-4111-8111-111111111111';
const AHORA = new Date('2026-01-02T10:00:00Z');

class PublicadorEspia implements PublicadorDeEventos {
  readonly publicados: EventoDeDominio[] = [];
  async publicar(eventos: EventoDeDominio[]): Promise<void> {
    this.publicados.push(...eventos);
  }
}

function armarHandler(saldoInicial: SaldoCreditos | null) {
  const vacantes = new VacanteRepositorioEnMemoria();
  const saldos = new SaldoCreditosRepositorioEnMemoria(saldoInicial);
  const publicador = new PublicadorEspia();
  const handler = new PublicarVacanteHandler(vacantes, saldos, publicador, { ahora: () => AHORA });
  return { vacantes, saldos, publicador, handler };
}

async function sembrarVacante(vacantes: VacanteRepositorioEnMemoria): Promise<void> {
  const vacante = Vacante.crear(
    VacanteId.desde(ID),
    Titulo.crear('Analista de datos'),
    Descripcion.crear('Buscamos un analista con experiencia en SQL.'),
    PerfilCargo.profesional(),
    AHORA,
  );
  await vacantes.guardar(vacante);
}

describe('PublicarVacanteHandler', () => {
  it('publica, descuenta el crédito y publica el evento DESPUÉS de guardar', async () => {
    const { vacantes, saldos, publicador, handler } = armarHandler(SaldoCreditos.crear(2));
    await sembrarVacante(vacantes);

    await handler.execute(new PublicarVacanteCommand(ID));

    const vacante = await vacantes.buscarPorId(VacanteId.desde(ID));
    expect(vacante?.estado.valor).toBe('PUBLICADA');

    const saldo = await saldos.obtener();
    expect(saldo?.valor).toBe(1);

    expect(publicador.publicados).toHaveLength(1);
    expect(publicador.publicados[0]).toBeInstanceOf(VacantePublicada);
    expect((publicador.publicados[0] as VacantePublicada).vacanteId).toBe(ID);
  });

  it('falla con NOT_FOUND si la vacante no existe', async () => {
    const { handler } = armarHandler(SaldoCreditos.crear(2));

    await expect(handler.execute(new PublicarVacanteCommand(ID))).rejects.toThrow(
      'No se encontró la vacante indicada.',
    );
  });

  it('falla con CREDITOS_INSUFICIENTES si no hay saldo registrado', async () => {
    const { vacantes, handler } = armarHandler(null);
    await sembrarVacante(vacantes);

    await expect(handler.execute(new PublicarVacanteCommand(ID))).rejects.toThrow(
      'No hay saldo de créditos suficiente para publicar la vacante.',
    );
  });

  it('falla si la vacante ya está publicada (no vuelve a descontar)', async () => {
    const { vacantes, saldos, handler } = armarHandler(SaldoCreditos.crear(2));
    await sembrarVacante(vacantes);

    await handler.execute(new PublicarVacanteCommand(ID));

    await expect(handler.execute(new PublicarVacanteCommand(ID))).rejects.toThrow(
      'La vacante ya está publicada.',
    );

    const saldo = await saldos.obtener();
    expect(saldo?.valor).toBe(1); // descontó una sola vez
  });
});
