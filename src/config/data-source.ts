import 'dotenv/config';
import { DataSource } from 'typeorm';
import { PostulacionOrmEntity } from '../postulaciones/infrastructure/persistence/orm/postulacion.orm-entity';
import { SaldoCreditosOrmEntity } from '../vacantes/infrastructure/persistence/orm/saldo-creditos.orm-entity';
import { VacanteOrmEntity } from '../vacantes/infrastructure/persistence/orm/vacante.orm-entity';

/**
 * Fuente de datos para el CLI de migraciones (`pnpm migration:run` / `migration:revert`).
 * Usa la misma configuración de conexión que la app, para que las migraciones no
 * vayan a parar a otra base.
 */
export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [VacanteOrmEntity, SaldoCreditosOrmEntity, PostulacionOrmEntity],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});
