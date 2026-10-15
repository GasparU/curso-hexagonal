import { EstadoPostulacion } from './estado-postulacion.vo';

describe('EstadoPostulacion', () => {
  it('nace en RECIBIDA', () => {
    expect(EstadoPostulacion.recibida().valor).toBe('RECIBIDA');
  });

  it('acepta los 4 estados del workflow', () => {
    expect(EstadoPostulacion.crear('EN_REVISION').valor).toBe('EN_REVISION');
    expect(EstadoPostulacion.crear('RECHAZADA').valor).toBe('RECHAZADA');
    expect(EstadoPostulacion.crear('CONTRATADA').valor).toBe('CONTRATADA');
  });

  it('rechaza un estado inventado', () => {
    expect(() => EstadoPostulacion.crear('PENDIENTE')).toThrow('El estado indicado no es válido.');
  });
});
