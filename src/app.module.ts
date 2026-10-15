import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { construirOpcionesBaseDeDatos } from './config/database.config';
import { validarEntorno } from './config/env.validation';
import { VacantesModule } from './vacantes/infrastructure/vacantes.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validarEntorno }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: construirOpcionesBaseDeDatos,
    }),
    EventEmitterModule.forRoot(),
    CqrsModule.forRoot(),
    VacantesModule,
  ],
})
export class AppModule {}
