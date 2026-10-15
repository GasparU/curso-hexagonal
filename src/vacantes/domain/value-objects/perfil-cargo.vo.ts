import { errorDeDominio } from '../../../comun/domain/errors/error-codes';

export const PERFILES_CARGO = ['PROFESIONAL', 'OPERARIO'] as const;
export type PerfilCargoValor = (typeof PERFILES_CARGO)[number];

export class PerfilCargo {
  private constructor(private readonly perfil: PerfilCargoValor) {}

  static crear(entrada: string): PerfilCargo {
    const normalizado = (entrada ?? '').trim().toUpperCase();
    if (!PERFILES_CARGO.includes(normalizado as PerfilCargoValor)) {
      throw errorDeDominio('PERFIL_CARGO_INVALIDO');
    }
    return new PerfilCargo(normalizado as PerfilCargoValor);
  }

  static profesional(): PerfilCargo {
    return new PerfilCargo('PROFESIONAL');
  }

  get valor(): PerfilCargoValor {
    return this.perfil;
  }

  esProfesional(): boolean {
    return this.perfil === 'PROFESIONAL';
  }

  equals(otro: PerfilCargo): boolean {
    return this.perfil === otro.perfil;
  }
}
