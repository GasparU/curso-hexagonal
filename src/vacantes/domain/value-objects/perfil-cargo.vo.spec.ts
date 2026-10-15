import { PerfilCargo } from './perfil-cargo.vo';

describe('PerfilCargo', () => {
  it('normaliza a mayúsculas', () => {
    expect(PerfilCargo.crear('  profesional ').valor).toBe('PROFESIONAL');
  });

  it('acepta OPERARIO', () => {
    expect(PerfilCargo.crear('operario').valor).toBe('OPERARIO');
  });

  it('rechaza un perfil que no existe', () => {
    expect(() => PerfilCargo.crear('GERENTE')).toThrow(
      'El perfil del cargo debe ser PROFESIONAL u OPERARIO.',
    );
  });
});
