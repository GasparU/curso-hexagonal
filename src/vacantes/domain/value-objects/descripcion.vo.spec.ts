import { Descripcion } from './descripcion.vo';

describe('Descripcion', () => {
  it('acepta una descripción suficientemente larga y la recorta', () => {
    expect(Descripcion.crear('  Buscamos un analista con experiencia.  ').valor).toBe(
      'Buscamos un analista con experiencia.',
    );
  });

  it('rechaza una descripción de menos de 20 caracteres', () => {
    expect(() => Descripcion.crear('Muy corta')).toThrow(
      'La descripción debe tener al menos 20 caracteres.',
    );
  });
});
