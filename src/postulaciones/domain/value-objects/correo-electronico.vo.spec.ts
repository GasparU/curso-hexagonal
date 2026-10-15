import { CorreoElectronico } from './correo-electronico.vo';

describe('CorreoElectronico', () => {
  it('acepta un correo válido y lo normaliza a minúsculas', () => {
    expect(CorreoElectronico.crear('  Ana.Perez@Correo.COM ').valor).toBe('ana.perez@correo.com');
  });

  it('rechaza un correo sin arroba', () => {
    expect(() => CorreoElectronico.crear('ana.correo.com')).toThrow(
      'El correo electrónico no tiene un formato válido.',
    );
  });

  it('rechaza un correo sin dominio', () => {
    expect(() => CorreoElectronico.crear('ana@')).toThrow(
      'El correo electrónico no tiene un formato válido.',
    );
  });
});
