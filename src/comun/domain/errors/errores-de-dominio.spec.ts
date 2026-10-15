import { ConsultaDeVacantes } from '../../../postulaciones/domain/ports/consulta-de-vacantes.port';
import { PostulacionRepositorio } from '../../../postulaciones/domain/ports/postulacion.repository';
import { RegistroDePostulaciones } from '../../../postulaciones/domain/services/registro-de-postulaciones';
import { CorreoElectronico } from '../../../postulaciones/domain/value-objects/correo-electronico.vo';
import { DocumentoIdentidad } from '../../../postulaciones/domain/value-objects/documento-identidad.vo';
import { NombreCompleto } from '../../../postulaciones/domain/value-objects/nombre-completo.vo';
import { VacanteId as VacanteIdDePostulaciones } from '../../../postulaciones/domain/value-objects/vacante-id.vo';
import { Vacante } from '../../../vacantes/domain/entities/vacante.entity';
import { Descripcion } from '../../../vacantes/domain/value-objects/descripcion.vo';
import { EstadoVacante } from '../../../vacantes/domain/value-objects/estado-vacante.vo';
import { PerfilCargo } from '../../../vacantes/domain/value-objects/perfil-cargo.vo';
import { SaldoCreditos } from '../../../vacantes/domain/value-objects/saldo-creditos.vo';
import { Titulo } from '../../../vacantes/domain/value-objects/titulo.vo';
import { VacanteId } from '../../../vacantes/domain/value-objects/vacante-id.vo';
import { DomainException } from './domain.exception';
import { CodigoError, ERRORES } from './error-codes';

const ID_VACANTE = '11111111-1111-4111-8111-111111111111';
const AHORA = new Date('2026-01-01T00:00:00Z');

/**
 * Este spec valida el CATÁLOGO COMPARTIDO de errores contra los dos contextos.
 * Es a propósito un archivo cruzado: el catálogo vive en `comun/` y su contrato
 * se cumple (o se rompe) en el dominio de Vacantes y de Postulaciones.
 *
 * Cada caso PROVOCA el error por el camino real de la regla, nunca lanzándolo a
 * mano: si el caso se escribiera como `throw errorDeDominio(code)`, el test
 * estaría comparando el catálogo consigo mismo y no probaría nada.
 */

interface Caso {
  code: CodigoError;
  cuando: string;
  provocar: () => unknown;
}

function vacanteEnBorrador(): Vacante {
  return Vacante.crear(
    VacanteId.desde(ID_VACANTE),
    Titulo.crear('Analista de datos'),
    Descripcion.crear('Buscamos un analista con experiencia en SQL.'),
    PerfilCargo.profesional(),
    AHORA,
  );
}

function vacantePublicada(): Vacante {
  const vacante = vacanteEnBorrador();
  vacante.publicar(SaldoCreditos.crear(5), AHORA);
  return vacante;
}

// dobles mínimos de los PUERTOS: el servicio de dominio no sabe que son falsos
const repositorioSinDuplicados: PostulacionRepositorio = {
  guardar: async () => undefined,
  buscarPorId: async () => null,
  existePorVacanteYDocumento: async () => false,
  listarPorVacante: async () => [],
};

const repositorioConDuplicado: PostulacionRepositorio = {
  ...repositorioSinDuplicados,
  existePorVacanteYDocumento: async () => true,
};

const vacanteQueExiste: ConsultaDeVacantes = { existe: async () => true };
const vacanteQueNoExiste: ConsultaDeVacantes = { existe: async () => false };

function intentarRegistrarPostulacion(
  postulaciones: PostulacionRepositorio,
  vacantes: ConsultaDeVacantes,
): Promise<void> {
  return new RegistroDePostulaciones(postulaciones, vacantes).asegurarQueSePuedaRegistrar(
    VacanteIdDePostulaciones.desde(ID_VACANTE),
    DocumentoIdentidad.crear('12345678'),
  );
}

const CASOS: Caso[] = [
  {
    code: 'ID_INVALIDO',
    cuando: 'el identificador no es un uuid',
    provocar: () => VacanteId.desde('no-soy-un-uuid'),
  },
  {
    code: 'TITULO_INVALIDO',
    cuando: 'el título es demasiado corto',
    provocar: () => Titulo.crear('ab'),
  },
  {
    code: 'DESCRIPCION_MUY_CORTA',
    cuando: 'la descripción es demasiado corta',
    provocar: () => Descripcion.crear('corta'),
  },
  {
    code: 'PERFIL_CARGO_INVALIDO',
    cuando: 'el perfil del cargo no existe',
    provocar: () => PerfilCargo.crear('JEFE_DE_AREA'),
  },
  {
    code: 'NOMBRE_INVALIDO',
    cuando: 'el nombre completo es demasiado corto',
    provocar: () => NombreCompleto.crear('Al'),
  },
  {
    code: 'DNI_INVALIDO',
    cuando: 'el DNI no tiene 8 dígitos',
    provocar: () => DocumentoIdentidad.crear('123'),
  },
  {
    code: 'CORREO_INVALIDO',
    cuando: 'el correo no tiene formato de correo',
    provocar: () => CorreoElectronico.crear('sin-arroba'),
  },
  {
    code: 'ESTADO_INVALIDO',
    cuando: 'el estado de la vacante no existe',
    provocar: () => EstadoVacante.crear('PAUSADA'),
  },
  {
    code: 'SALDO_INVALIDO',
    cuando: 'el saldo de créditos es negativo',
    provocar: () => SaldoCreditos.crear(-1),
  },
  {
    code: 'VACANTE_NO_ENCONTRADA',
    cuando: 'se postula a una vacante que no existe',
    provocar: () => intentarRegistrarPostulacion(repositorioSinDuplicados, vacanteQueNoExiste),
  },
  {
    code: 'VACANTE_YA_PUBLICADA',
    cuando: 'se publica una vacante ya publicada',
    provocar: () => {
      const vacante = vacantePublicada();
      return vacante.publicar(SaldoCreditos.crear(5), AHORA);
    },
  },
  {
    code: 'VACANTE_YA_CERRADA',
    cuando: 'se opera sobre una vacante ya cerrada',
    provocar: () => {
      const vacante = vacantePublicada();
      vacante.cerrar(AHORA);
      return vacante.cerrar(AHORA);
    },
  },
  {
    code: 'VACANTE_NO_PUBLICADA',
    cuando: 'se cierra una vacante que todavía está en borrador',
    provocar: () => vacanteEnBorrador().cerrar(AHORA),
  },
  {
    code: 'CREDITOS_INSUFICIENTES',
    cuando: 'no hay saldo para publicar',
    provocar: () => vacanteEnBorrador().publicar(SaldoCreditos.cero(), AHORA),
  },
  {
    code: 'POSTULANTE_YA_POSTULO',
    cuando: 'el mismo DNI ya se postuló a esa vacante',
    provocar: () => intentarRegistrarPostulacion(repositorioConDuplicado, vacanteQueExiste),
  },
];

async function capturarErrorDeDominio(provocar: () => unknown): Promise<DomainException> {
  try {
    await provocar();
  } catch (error) {
    if (error instanceof DomainException) {
      return error;
    }
    throw error;
  }
  throw new Error('Se esperaba un error de dominio y no se lanzó ninguno.');
}

describe('Catálogo de errores de dominio', () => {
  it.each(CASOS)('$code — $cuando', async ({ code, provocar }) => {
    const error = await capturarErrorDeDominio(provocar);

    expect(error.code).toBe(code);
    expect(error.kind).toBe(ERRORES[code].kind);
    expect(error.message).toBe(ERRORES[code].mensaje);
  });

  it('no hay ningún error del catálogo sin prueba (y ninguno repetido)', () => {
    const cubiertos = new Set(CASOS.map((caso) => caso.code));
    const sinPrueba = (Object.keys(ERRORES) as CodigoError[]).filter(
      (codigo) => !cubiertos.has(codigo),
    );

    expect(sinPrueba).toEqual([]);
    expect(cubiertos.size).toBe(CASOS.length);
  });
});
