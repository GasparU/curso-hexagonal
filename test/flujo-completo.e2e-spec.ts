import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/app.setup';
import { ID_SALDO_UNICO } from '../src/vacantes/infrastructure/persistence/typeorm-saldo-creditos.repository';

/**
 * e2e contra Postgres REAL. Arranca la app con la MISMA función de configuración
 * que `main.ts` (`configurarApp`), así lo que se prueba es la app de verdad.
 *
 * Requiere: base levantada + migraciones aplicadas (`pnpm migration:run`).
 */
describe('Flujo completo (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  const servidor = () => request(app.getHttpServer());

  const vacanteValida = {
    titulo: 'Analista de datos',
    descripcion: 'Buscamos un analista con experiencia en SQL y Power BI.',
    perfilCargo: 'PROFESIONAL',
  };

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = modulo.createNestApplication();
    configurarApp(app);
    await app.init();
    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // base limpia + saldo conocido en cada test (los tests no se pisan entre sí)
    await dataSource.query('DELETE FROM postulaciones');
    await dataSource.query('DELETE FROM vacantes');
    await dataSource.query('DELETE FROM saldos_creditos');
    await dataSource.query('INSERT INTO saldos_creditos (id, disponible) VALUES ($1, $2)', [
      ID_SALDO_UNICO,
      3,
    ]);
  });

  async function crearVacante(): Promise<string> {
    const respuesta = await servidor().post('/vacantes').send(vacanteValida);
    expect(respuesta.status).toBe(201);
    return respuesta.body.id as string;
  }

  async function publicarVacante(id: string): Promise<void> {
    const respuesta = await servidor().post(`/vacantes/${id}/publicar`);
    expect(respuesta.status).toBe(204);
  }

  it('crea una vacante y nace en BORRADOR', async () => {
    const id = await crearVacante();

    const respuesta = await servidor().get(`/vacantes/${id}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.estado).toBe('BORRADOR');
    expect(respuesta.body.postulacionesRecibidas).toBe(0);
    expect(respuesta.body.publicadaEn).toBeNull();
  });

  it('publica la vacante y descuenta un crédito', async () => {
    const id = await crearVacante();

    await publicarVacante(id);

    const respuesta = await servidor().get(`/vacantes/${id}`);
    expect(respuesta.body.estado).toBe('PUBLICADA');
    expect(respuesta.body.publicadaEn).not.toBeNull();

    const [saldo] = await dataSource.query('SELECT disponible FROM saldos_creditos');
    expect(saldo.disponible).toBe(2);
  });

  it('rechaza publicar dos veces con 409 VACANTE_YA_PUBLICADA', async () => {
    const id = await crearVacante();
    await publicarVacante(id);

    const respuesta = await servidor().post(`/vacantes/${id}/publicar`);

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.code).toBe('VACANTE_YA_PUBLICADA');
  });

  it('rechaza publicar sin créditos con 409 CREDITOS_INSUFICIENTES', async () => {
    const id = await crearVacante();
    await dataSource.query('UPDATE saldos_creditos SET disponible = 0');

    const respuesta = await servidor().post(`/vacantes/${id}/publicar`);

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.code).toBe('CREDITOS_INSUFICIENTES');
  });

  it('postular incrementa el contador de la vacante (evento cross-contexto)', async () => {
    const id = await crearVacante();
    await publicarVacante(id);

    const respuesta = await servidor().post(`/vacantes/${id}/postulaciones`).send({
      nombreCompleto: 'Ana Pérez',
      documentoIdentidad: '12345678',
      correo: 'ana@correo.com',
    });

    expect(respuesta.status).toBe(201);

    // el contador vive en OTRO contexto: si subió, el evento cruzó de verdad
    const vacante = await servidor().get(`/vacantes/${id}`);
    expect(vacante.body.postulacionesRecibidas).toBe(1);
  });

  it('rechaza el mismo DNI en la misma vacante con 409 POSTULANTE_YA_POSTULO', async () => {
    const id = await crearVacante();
    const postulante = {
      nombreCompleto: 'Ana Pérez',
      documentoIdentidad: '12345678',
      correo: 'ana@correo.com',
    };

    const primera = await servidor().post(`/vacantes/${id}/postulaciones`).send(postulante);
    expect(primera.status).toBe(201);

    const repetida = await servidor().post(`/vacantes/${id}/postulaciones`).send(postulante);
    expect(repetida.status).toBe(409);
    expect(repetida.body.code).toBe('POSTULANTE_YA_POSTULO');
  });

  it('lista las postulaciones de una vacante', async () => {
    const id = await crearVacante();
    await servidor().post(`/vacantes/${id}/postulaciones`).send({
      nombreCompleto: 'Ana Pérez',
      documentoIdentidad: '12345678',
      correo: 'ana@correo.com',
    });

    const respuesta = await servidor().get(`/vacantes/${id}/postulaciones`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toHaveLength(1);
    expect(respuesta.body[0].documentoIdentidad).toBe('12345678');
    expect(respuesta.body[0].estado).toBe('RECIBIDA');
  });

  it('devuelve 404 al postular a una vacante que no existe', async () => {
    const respuesta = await servidor()
      .post('/vacantes/99999999-9999-4999-8999-999999999999/postulaciones')
      .send({
        nombreCompleto: 'Ana Pérez',
        documentoIdentidad: '12345678',
        correo: 'ana@correo.com',
      });

    expect(respuesta.status).toBe(404);
    expect(respuesta.body.code).toBe('VACANTE_NO_ENCONTRADA');
  });

  it('devuelve 404 al pedir una vacante que no existe', async () => {
    const respuesta = await servidor().get('/vacantes/99999999-9999-4999-8999-999999999999');

    expect(respuesta.status).toBe(404);
    expect(respuesta.body.code).toBe('VACANTE_NO_ENCONTRADA');
  });

  it('rechaza un body inválido con 400 y campos de más', async () => {
    const porTituloCorto = await servidor()
      .post('/vacantes')
      .send({ ...vacanteValida, titulo: 'abc' });
    expect(porTituloCorto.status).toBe(400);

    const conCampoDeMas = await servidor()
      .post('/vacantes')
      .send({ ...vacanteValida, campoRaro: 'x' });
    expect(conCampoDeMas.status).toBe(400);
  });

  it('rechaza un DNI inválido con 400', async () => {
    const id = await crearVacante();

    const respuesta = await servidor().post(`/vacantes/${id}/postulaciones`).send({
      nombreCompleto: 'Ana Pérez',
      documentoIdentidad: '1234',
      correo: 'ana@correo.com',
    });

    expect(respuesta.status).toBe(400);
  });
});
