import { SaldoCreditos } from './saldo-creditos.vo';

describe('SaldoCreditos', () => {
  it('descuenta un crédito y devuelve un saldo nuevo (no muta el original)', () => {
    const saldo = SaldoCreditos.crear(3);
    const restante = saldo.descontar();

    expect(restante.valor).toBe(2);
    expect(saldo.valor).toBe(3);
  });

  it('rechaza descontar cuando no alcanza', () => {
    expect(() => SaldoCreditos.crear(0).descontar()).toThrow(
      'No hay saldo de créditos suficiente para publicar la vacante.',
    );
  });

  it('rechaza un saldo negativo', () => {
    expect(() => SaldoCreditos.crear(-1)).toThrow(
      'El saldo de créditos debe ser un entero mayor o igual a cero.',
    );
  });

  it('sabe si alcanza', () => {
    expect(SaldoCreditos.cero().alcanzaPara()).toBe(false);
    expect(SaldoCreditos.crear(1).alcanzaPara()).toBe(true);
  });
});
