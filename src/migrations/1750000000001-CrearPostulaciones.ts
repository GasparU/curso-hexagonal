import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Tabla del contexto Postulaciones. Las dos reglas que solo la base puede
 * garantizar: el dedup por DNI (UNIQUE) y la integridad de la vacante (FK).
 */
export class CrearPostulaciones1750000000001 implements MigrationInterface {
  name = 'CrearPostulaciones1750000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "postulaciones" (
        "id" uuid NOT NULL,
        "vacante_id" uuid NOT NULL,
        "nombre_completo" character varying(120) NOT NULL,
        "documento_identidad" character varying(8) NOT NULL,
        "correo" character varying(160) NOT NULL,
        "estado" character varying(20) NOT NULL,
        "creada_en" TIMESTAMP WITH TIME ZONE NOT NULL,
        CONSTRAINT "pk_postulacion" PRIMARY KEY ("id"),
        CONSTRAINT "fk_postulacion_vacante" FOREIGN KEY ("vacante_id") REFERENCES "vacantes"("id"),
        CONSTRAINT "uq_postulacion_vacante_documento" UNIQUE ("vacante_id", "documento_identidad"),
        CONSTRAINT "ck_postulacion_estado" CHECK ("estado" IN ('RECIBIDA', 'EN_REVISION', 'RECHAZADA', 'CONTRATADA'))
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "ix_postulacion_vacante" ON "postulaciones" ("vacante_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "postulaciones"`);
  }
}
