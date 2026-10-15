import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Tablas del contexto Vacantes. El esquema sale de migraciones (`synchronize: false`).
 */
export class CrearVacantes1750000000000 implements MigrationInterface {
  name = 'CrearVacantes1750000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "vacantes" (
        "id" uuid NOT NULL,
        "titulo" character varying(120) NOT NULL,
        "descripcion" text NOT NULL,
        "perfil_cargo" character varying(20) NOT NULL,
        "estado" character varying(20) NOT NULL,
        "creada_en" TIMESTAMP WITH TIME ZONE NOT NULL,
        "publicada_en" TIMESTAMP WITH TIME ZONE,
        "cerrada_en" TIMESTAMP WITH TIME ZONE,
        "postulaciones_recibidas" integer NOT NULL DEFAULT 0,
        CONSTRAINT "pk_vacante" PRIMARY KEY ("id"),
        CONSTRAINT "ck_vacante_perfil_cargo" CHECK ("perfil_cargo" IN ('PROFESIONAL', 'OPERARIO')),
        CONSTRAINT "ck_vacante_estado" CHECK ("estado" IN ('BORRADOR', 'PUBLICADA', 'CERRADA')),
        CONSTRAINT "ck_vacante_postulaciones" CHECK ("postulaciones_recibidas" >= 0)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "saldos_creditos" (
        "id" uuid NOT NULL,
        "disponible" integer NOT NULL,
        CONSTRAINT "pk_saldo_creditos" PRIMARY KEY ("id"),
        CONSTRAINT "ck_saldo_no_negativo" CHECK ("disponible" >= 0)
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "saldos_creditos"`);
    await queryRunner.query(`DROP TABLE "vacantes"`);
  }
}
