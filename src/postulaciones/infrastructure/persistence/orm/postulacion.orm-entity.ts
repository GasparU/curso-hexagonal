import { Column, Entity, Index, PrimaryColumn, Unique } from 'typeorm';

/**
 * Entidad del ORM. El UNIQUE de `(vacante_id, documento_identidad)` es el mismo
 * que crea la migración: el dedup por DNI también lo cuida la base.
 */
@Entity({ name: 'postulaciones' })
@Unique('uq_postulacion_vacante_documento', ['vacanteId', 'documentoIdentidad'])
@Index('ix_postulacion_vacante', ['vacanteId'])
export class PostulacionOrmEntity {
  @PrimaryColumn('uuid', { name: 'id' })
  id!: string;

  @Column({ name: 'vacante_id', type: 'uuid' })
  vacanteId!: string;

  @Column({ name: 'nombre_completo', type: 'varchar', length: 120 })
  nombreCompleto!: string;

  @Column({ name: 'documento_identidad', type: 'varchar', length: 8 })
  documentoIdentidad!: string;

  @Column({ name: 'correo', type: 'varchar', length: 160 })
  correo!: string;

  @Column({ name: 'estado', type: 'varchar', length: 20 })
  estado!: string;

  @Column({ name: 'creada_en', type: 'timestamptz' })
  creadaEn!: Date;
}
