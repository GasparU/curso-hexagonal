import { Titulo } from './titulo.vo';

describe('Titulo', () => {
  it('acepta un título válido y recorta los espacios de los costados', () => {
    expect(Titulo.crear('   Analista de datos   ').valor).toBe('Analista de datos');
  });

  it('rechaza un título demasiado corto', () => {
    expect(() => Titulo.crear('abc')).toThrow('El título debe tener entre 5 y 120 caracteres.');
  });

  it('rechaza un título demasiado largo', () => {
    expect(() => Titulo.crear('a'.repeat(121))).toThrow('El título debe tener entre 5 y 120 caracteres.');
  });

  it('compara por valor', () => {
    expect(Titulo.crear('Analista').equals(Titulo.crear('Analista'))).toBe(true);
    expect(Titulo.crear('Analista').equals(Titulo.crear('Operario'))).toBe(false);
  });
});
