/**
 * Único lugar del proyecto que lee `process.env`.
 * Si falta una variable obligatoria, la app NO arranca (nada de defaults silenciosos).
 */
export interface VariablesEntorno {
  DB_HOST: string;
  DB_PORT: number;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_NAME: string;
  PORT: number;
}

const OBLIGATORIAS = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'PORT'] as const;

export function validarEntorno(env: Record<string, unknown>): VariablesEntorno {
  const faltantes = OBLIGATORIAS.filter((clave) => {
    const valor = env[clave];
    return valor === undefined || valor === null || `${valor}`.trim() === '';
  });

  if (faltantes.length > 0) {
    throw new Error(
      `Faltan variables de entorno obligatorias: ${faltantes.join(', ')}. Revisá el .env.example.`,
    );
  }

  return {
    DB_HOST: `${env.DB_HOST}`,
    DB_PORT: aNumeroPositivo(env.DB_PORT, 'DB_PORT'),
    DB_USER: `${env.DB_USER}`,
    DB_PASSWORD: `${env.DB_PASSWORD}`,
    DB_NAME: `${env.DB_NAME}`,
    PORT: aNumeroPositivo(env.PORT, 'PORT'),
  };
}

function aNumeroPositivo(valor: unknown, clave: string): number {
  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero <= 0) {
    throw new Error(`La variable ${clave} debe ser un número entero positivo.`);
  }
  return numero;
}
