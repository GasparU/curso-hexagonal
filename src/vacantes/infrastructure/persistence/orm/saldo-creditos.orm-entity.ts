import { Column, Entity, PrimaryColumn } from 'typeorm';

/** Fila única con el saldo de créditos disponible (es un singleton). */
@Entity({ name: 'saldos_creditos' })
export class SaldoCreditosOrmEntity {
  @PrimaryColumn('uuid', { name: 'id' })
  id!: string;

  @Column({ name: 'disponible', type: 'int' })
  disponible!: number;
}
