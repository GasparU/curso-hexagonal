import { ConsultaDeVacantes } from '../ports/consulta-de-vacantes.port';
import { PostulacionRepositorio } from '../ports/postulacion.repository';
import { DocumentoIdentidad } from '../value-objects/documento-identidad.vo';
import { VacanteId } from '../value-objects/vacante-id.vo';
import { DomainException } from '../../../comun/domain/errors/domain.exception';
import { RegistroDePostulaciones } from './registro-de-postulaciones';

const VACANTE_ID = '11111111-1111-4111-8111-111111111111';

class VacantesEspia implements ConsultaDeVacantes {
  consultas = 0;

  constructor(private readonly existeLaVacante: boolean) {}

  async existe(): Promise<boolean> {
    this.consultas += 1;
    return this.existeLaVacante;
  }
}

class PostulacionesEspia implements PostulacionRepositorio {
  consultasDeDuplicado = 0;

  constructor(private readonly hayDuplicado: boolean) {}

  async guardar(): Promise<void> {
    return undefined;
  }

  async buscarPorId(): Promise<null> {
    return null;
  }

  async existePorVacanteYDocumento(): Promise<boolean> {
    this.consultasDeDuplicado += 1;
    return this.hayDuplicado;
  }

  async listarPorVacante(): Promise<[]> {
    return [];
  }
}

function armar(vacanteExiste: boolean, hayDuplicado: boolean) {
  const vacantes = new VacantesEspia(vacanteExiste);
  const postulaciones = new PostulacionesEspia(hayDuplicado);
  const registro = new RegistroDePostulaciones(postulaciones, vacantes);

  const intentar = () =>
    registro.asegurarQueSePuedaRegistrar(
      VacanteId.desde(VACANTE_ID),
      DocumentoIdentidad.crear('12345678'),
    );

  return { vacantes, postulaciones, intentar };
}

async function capturar(intentar: () => Promise<void>): Promise<DomainException> {
  try {
    await intentar();
  } catch (error) {
    if (error instanceof DomainException) {
      return error;
    }
    throw error;
  }
  throw new Error('Se esperaba un error de dominio y no se lanzó ninguno.');
}

describe('RegistroDePostulaciones', () => {
  it('deja pasar cuando la vacante existe y el DNI no se postuló todavía', async () => {
    const { vacantes, postulaciones, intentar } = armar(true, false);

    await expect(intentar()).resolves.toBeUndefined();
    expect(vacantes.consultas).toBe(1);
    expect(postulaciones.consultasDeDuplicado).toBe(1);
  });

  it('rechaza con VACANTE_NO_ENCONTRADA y NI SIQUIERA consulta las postulaciones', async () => {
    const { postulaciones, intentar } = armar(false, false);

    const error = await capturar(intentar);

    expect(error.code).toBe('VACANTE_NO_ENCONTRADA');
    expect(error.kind).toBe('NOT_FOUND');
    // la vacante se valida primero: corta antes de tocar el repositorio de postulaciones
    expect(postulaciones.consultasDeDuplicado).toBe(0);
  });

  it('rechaza con POSTULANTE_YA_POSTULO cuando el mismo DNI ya se postuló', async () => {
    const { intentar } = armar(true, true);

    const error = await capturar(intentar);

    expect(error.code).toBe('POSTULANTE_YA_POSTULO');
    expect(error.kind).toBe('CONFLICT');
  });
});
