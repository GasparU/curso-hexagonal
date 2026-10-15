import { EstadoVacante } from './estado-vacante.vo';

describe('EstadoVacante', () => {
  it('expone los estados por nombre', () => {
    expect(EstadoVacante.borrador().valor).toBe('BORRADOR');
    expect(EstadoVacante.publicada().valor).toBe('PUBLICADA');
    expect(EstadoVacante.cerrada().valor).toBe('CERRADA');
  });

  it('responde a sus banderas', () => {
    expect(EstadoVacante.publicada().esPublicada()).toBe(true);
    expect(EstadoVacante.publicada().esBorrador()).toBe(false);
    expect(EstadoVacante.cerrada().esCerrada()).toBe(true);
  });

  it('rechaza un estado inventado', () => {
    expect(() => EstadoVacante.crear('PAUSADA')).toThrow('El estado indicado no es válido.');
  });
});
