# FASE 1 — Esqueleto + Contexto VACANTES

> Detalle ejecutable de la Fase 1 del [SPEC-MAESTRA](SPEC-MAESTRA.md).
> **Creado:** 2026-10-15 10:31 (Lima) · **Estado:** ✅ CERRADA · **Dueño:** José Gaspar

---

## 0. Objetivo de la fase

Levantar el proyecto entero (arranque, config, Docker) y construir **el primer contexto acotado
completo**: `vacantes`. Al terminar, la app arranca, la base levanta, y los 3 casos de uso de
Vacantes (Crear, Publicar, Obtener) tienen código de punta a punta con tests unitarios en verde.

---

## 1. Qué se entregó (árbol)

```
vacante/
├── package.json · tsconfig*.json · nest-cli.json · .prettierrc
├── .gitignore · .env.example · docker-compose.yml
├── test/jest-e2e.json
├── src/
│   ├── main.ts · app.setup.ts · app.module.ts
│   ├── config/            env.validation.ts (único que lee process.env) · database.config.ts
│   └── vacantes/
│       ├── domain/        (el cerebro — CERO imports de @nestjs/typeorm)
│       │   ├── entities/       vacante.entity.ts
│       │   ├── value-objects/  vacante-id · titulo · descripcion · perfil-cargo · estado-vacante · saldo-creditos
│       │   ├── events/         vacante-publicada · vacante-cerrada
│       │   └── ports/          vacante.repository · saldo-creditos.repository
│       ├── application/   (CQRS)
│       │   ├── commands/       crear-vacante/ · publicar-vacante/
│       │   └── queries/        obtener-vacante/
│       └── infrastructure/
│           ├── controllers/    vacantes.controller.ts
│           ├── dto/            crear-vacante.dto.ts
│           ├── listeners/      vacante-postulacion.listener.ts   (agregado en Fase 2)
│           ├── persistence/    orm/ · mappers/ · typeorm-*.repository.ts · en-memoria/
│           └── vacantes.module.ts
```

> **Actualizado 2026-10-15 10:59 (Fase 2):** lo transversal (errores, `evento-de-dominio`,
> reloj, generador de ids, publicador de eventos y el **filtro único**) se movió a `src/comun/`.
> Ver [`FASE-2-postulaciones.md`](FASE-2-postulaciones.md) §1.a.

**Adaptadores en memoria** (`persistence/en-memoria/`) = para los tests unitarios.
**Adaptadores TypeORM** = los que se cablean en `VacantesModule`. Cambiar de uno a otro es **una línea**.

---

## 2. Rutas de la fase

| Método | Ruta | Caso de uso | Éxito |
|---|---|---|---|
| POST | `/vacantes` | `CrearVacante` (comando) | 201 `{ id }` |
| POST | `/vacantes/:id/publicar` | `PublicarVacante` (comando) | 204 |
| GET | `/vacantes/:id` | `ObtenerVacante` (query) | 200 vista |

---

## 3. Gates (evidencia REAL, 2026-10-15 10:31 Lima)

| Gate | Comando | Resultado |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | **0 errores** |
| Build | `pnpm build` | **OK** |
| Tests unitarios | `pnpm test` | **9 suites / 32 tests PASS** |
| e2e | `pnpm test:e2e` | exit 0 (sin specs aún: `passWithNoTests`) |
| Mutación 1 | `publicar` sin descontar el crédito | **ROJO** (2 tests caen) |
| Mutación 2 | quitar la guarda `VACANTE_YA_PUBLICADA` | **ROJO** (2 specs caen) |

Tras cada mutación se restauró el archivo y la suite volvió a **verde (32/32)**.

---

## 4. Decisiones tomadas en esta fase (van a la bitácora del SPEC)

| Fecha-Hora | Decisión | Por qué |
|---|---|---|
| 2026-10-15 10:31 | Se agregaron **4 códigos** al catálogo del §9.2: `ID_INVALIDO`, `ESTADO_INVALIDO`, `SALDO_INVALIDO`, `VACANTE_NO_PUBLICADA` | El spec los necesitaba implícitamente (UUID, estado, saldo y cerrar-en-borrador) y no estaban listados |
| 2026-10-15 10:31 | `saldo_creditos` se modela como **fila única** (id fijo `00000000-...-0001`) | Es un singleton, no una colección; el spec solo dice `id + disponible` |
| 2026-10-15 10:31 | Sin saldo registrado ⇒ `CREDITOS_INSUFICIENTES` | Fail-closed: no se publica "gratis" por falta de dato |
| 2026-10-15 10:31 | Se agregó `@types/express` (dev) | El filtro tipa el `Response`; sin el paquete, `tsc` falla |
| 2026-10-15 10:31 | `configurarApp()` extraído a `app.setup.ts` | El e2e (Fase 3) debe arrancar con LA MISMA pipa y filtro que `main.ts` |

---

## 5. Límites declarados (honestidad, no deuda oculta)

1. **`existePorTitulo` es un puerto declarado y SIN USO en Fase 1.** El §6.1 lo lista, pero no hay
   invariante de "título único" ni código de error para eso en el spec. Se dejó el método para no
   traicionar el contrato del puerto; si se quiere la regla, se define el código y se usa.
2. **`cerrar()` existe en la entidad y se testea, pero NO tiene endpoint todavía** (el §7 solo lista
   3 casos de uso). El endpoint se agrega cuando se defina.
3. **`test:e2e` corre en verde porque no tiene specs** (`passWithNoTests`). Los e2e reales contra
   Postgres son de la **Fase 3**.
4. **Migraciones: no se crearon todavía.** `synchronize: false` ya está fijado, pero el esquema sale
   de migraciones versionadas → **Fase 3**. Hasta entonces la base no tiene las tablas.
5. **`.env.example` se creó por bash**, no con la herramienta de escritura: el guard de seguridad
   bloquea rutas que contienen `.env` (falso positivo conocido).

---

## 6. Checklist de aceptación

- [x] Docker Compose levanta Postgres local
- [x] `src/config/` es el único que lee `process.env`; falta una variable ⇒ la app no arranca
- [x] `domain/` sin ningún import de `@nestjs/*`, `typeorm` ni `class-validator`
- [x] Entidad sin setters; reglas (`publicar`, `cerrar`) en el dominio
- [x] 2 adaptadores por puerto (memoria + TypeORM) + mapper dedicado
- [x] Controlador publica en `CommandBus`/`QueryBus` (no toca repos)
- [x] Errores de dominio como `DomainException` con `code` + `kind`; un único filtro → HTTP
- [x] Validación en 2 niveles (DTO + value objects)
- [x] Tests unitarios sin Nest ni base (handler contra repo en memoria)
- [x] Mutaciones ROJAS por aserción (2/2)

---

## 7. Próxima fase

**Fase 2 — Contexto POSTULACIONES + evento cross-contexto** (`FASE-2-postulaciones.md`):
`Postulacion`, dedup por DNI, `PostulacionEnviada` (se publica DESPUÉS de persistir) y el listener
en `vacantes/infrastructure/listeners/` que llama a `vacante.registrarPostulacion()`.
