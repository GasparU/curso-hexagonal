import { Vacante } from './vacante.entity';
import { Descripcion } from '../value-objects/descripcion.vo';
import { EstadoVacante } from '../value-objects/estado-vacante.vo';
import { PerfilCargo } from '../value-objects/perfil-cargo.vo';
import { SaldoCreditos } from '../value-objects/saldo-creditos.vo';
import { Titulo } from '../value-objects/titulo.vo';
import { VacanteId } from '../value-objects/vacante-id.vo';

const ID = '11111111-1111-4111-8111-111111111111';
const AHORA = new Date('2026-01-01T00:00:00Z');

function nuevaVacante(): Vacante {
  return Vacante.crear(
    VacanteId.desde(ID),
    Titulo.crear('Analista de datos'),
    Descripcion.crear('Buscamos un analista con experiencia en SQL.'),
    PerfilCargo.profesional(),
    AHORA,
  );
}

describe('Vacante', () => {
  it('nace en BORRADOR, sin fechas de publicación ni cierre y con cero postulaciones', () => {
    const vacante = nuevaVacante();

    expect(vacante.estado.valor).toBe('BORRADOR');
    expect(vacante.publicadaEn).toBeNull();
    expect(vacante.cerradaEn).toBeNull();
    expect(vacante.postulacionesRecibidas).toBe(0);
  });

  it('publicar consume un crédito y devuelve el saldo restante', () => {
    const vacante = nuevaVacante();
    const cuando = new Date('2026-01-02T09:00:00Z');

    const saldoRestante = vacante.publicar(SaldoCreditos.crear(5), cuando);

    expect(vacante.estado.valor).toBe('PUBLICADA');
    expect(vacante.publicadaEn).toEqual(cuando);
    expect(saldoRestante.valor).toBe(4);
  });

  it('no se puede publicar dos veces', () => {
    const vacante = nuevaVacante();
    vacante.publicar(SaldoCreditos.crear(5), AHORA);

    expect(() => vacante.publicar(SaldoCreditos.crear(5), AHORA)).toThrow(
      'La vacante ya está publicada.',
    );
  });

  it('no se puede publicar sin créditos', () => {
    const vacante = nuevaVacante();

    expect(() => vacante.publicar(SaldoCreditos.cero(), AHORA)).toThrow(
      'No hay saldo de créditos suficiente para publicar la vacante.',
    );
    // y no cambia de estado si falla
    expect(vacante.estado.valor).toBe('BORRADOR');
  });

  it('no se puede cerrar una vacante en BORRADOR', () => {
    const vacante = nuevaVacante();

    expect(() => vacante.cerrar(AHORA)).toThrow(
      'Primero hay que publicar la vacante antes de cerrarla.',
    );
  });

  it('registrarPostulacion suma al contador', () => {
    const vacante = nuevaVacante();

    vacante.registrarPostulacion();
    vacante.registrarPostulacion();

    expect(vacante.postulacionesRecibidas).toBe(2);
  });

  it('una vacante cerrada no se vuelve a cerrar ni se publica', () => {
    const vacante = nuevaVacante();
    vacante.publicar(SaldoCreditos.crear(2), AHORA);
    vacante.cerrar(AHORA);

    expect(vacante.estado.valor).toBe('CERRADA');
    expect(vacante.cerradaEn).toEqual(AHORA);
    expect(() => vacante.cerrar(AHORA)).toThrow('La vacante ya está cerrada.');
    expect(() => vacante.publicar(SaldoCreditos.crear(2), AHORA)).toThrow(
      'La vacante ya está cerrada.',
    );
  });

  it('reconstruir rehidrata el estado que viene de la base', () => {
    const vacante = Vacante.reconstruir(
      VacanteId.desde(ID),
      Titulo.crear('Analista de datos'),
      Descripcion.crear('Buscamos un analista con experiencia en SQL.'),
      PerfilCargo.profesional(),
      AHORA,
      EstadoVacante.publicada(),
      new Date('2026-01-02T00:00:00Z'),
      null,
      7,
    );

    expect(vacante.estado.valor).toBe('PUBLICADA');
    expect(vacante.postulacionesRecibidas).toBe(7);
  });
});
