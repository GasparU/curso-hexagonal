import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { SaldoCreditosOrmEntity } from '../vacantes/infrastructure/persistence/orm/saldo-creditos.orm-entity';
import { VacanteOrmEntity } from '../vacantes/infrastructure/persistence/orm/vacante.orm-entity';

/**
 * Opciones de conexión. Lee del ConfigService (que ya pasó por `validarEntorno`),
 * nunca de `process.env` directo.
 */
export function construirOpcionesBaseDeDatos(config: ConfigService): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    host: config.getOrThrow<string>('DB_HOST'),
    port: config.getOrThrow<number>('DB_PORT'),
    username: config.getOrThrow<string>('DB_USER'),
    password: config.getOrThrow<string>('DB_PASSWORD'),
    database: config.getOrThrow<string>('DB_NAME'),
    entities: [VacanteOrmEntity, SaldoCreditosOrmEntity],
    synchronize: false, // el esquema sale de migraciones versionadas, nunca de sync automático
  };
}
