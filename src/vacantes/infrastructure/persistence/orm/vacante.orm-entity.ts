import { Column, Entity, PrimaryColumn } from 'typeorm';

/** Entidad del ORM. Es distinta de la entidad del dominio. */
@Entity({ name: 'vacantes' })
export class VacanteOrmEntity {
  @PrimaryColumn('uuid', { name: 'id' })
  id!: string;

  @Column({ name: 'titulo', type: 'varchar', length: 120 })
  titulo!: string;

  @Column({ name: 'descripcion', type: 'text' })
  descripcion!: string;

  @Column({ name: 'perfil_cargo', type: 'varchar', length: 20 })
  perfilCargo!: string;

  @Column({ name: 'estado', type: 'varchar', length: 20 })
  estado!: string;

  @Column({ name: 'creada_en', type: 'timestamptz' })
  creadaEn!: Date;

  @Column({ name: 'publicada_en', type: 'timestamptz', nullable: true })
  publicadaEn!: Date | null;

  @Column({ name: 'cerrada_en', type: 'timestamptz', nullable: true })
  cerradaEn!: Date | null;

  @Column({ name: 'postulaciones_recibidas', type: 'int', default: 0 })
  postulacionesRecibidas!: number;
}
