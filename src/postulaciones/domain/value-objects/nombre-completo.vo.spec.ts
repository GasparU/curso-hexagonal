import { NombreCompleto } from './nombre-completo.vo';

describe('NombreCompleto', () => {
  it('acepta un nombre válido y recorta espacios', () => {
    expect(NombreCompleto.crear('  Ana Pérez  ').valor).toBe('Ana Pérez');
  });

  it('rechaza un nombre demasiado corto', () => {
    expect(() => NombreCompleto.crear('Al')).toThrow(
      'El nombre completo debe tener entre 3 y 120 caracteres.',
    );
  });

  it('rechaza un nombre demasiado largo', () => {
    expect(() => NombreCompleto.crear('a'.repeat(121))).toThrow(
      'El nombre completo debe tener entre 3 y 120 caracteres.',
    );
  });
});
