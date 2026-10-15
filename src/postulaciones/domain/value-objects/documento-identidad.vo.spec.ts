import { DocumentoIdentidad } from './documento-identidad.vo';

describe('DocumentoIdentidad', () => {
  it('acepta un DNI de 8 dígitos', () => {
    expect(DocumentoIdentidad.crear('12345678').valor).toBe('12345678');
  });

  it('recorta espacios', () => {
    expect(DocumentoIdentidad.crear(' 12345678 ').valor).toBe('12345678');
  });

  it('rechaza un DNI con letras', () => {
    expect(() => DocumentoIdentidad.crear('1234567A')).toThrow(
      'El DNI debe tener exactamente 8 dígitos.',
    );
  });

  it('rechaza un DNI de 7 dígitos', () => {
    expect(() => DocumentoIdentidad.crear('1234567')).toThrow(
      'El DNI debe tener exactamente 8 dígitos.',
    );
  });

  it('compara por valor', () => {
    expect(DocumentoIdentidad.crear('12345678').equals(DocumentoIdentidad.crear('12345678'))).toBe(
      true,
    );
  });
});
