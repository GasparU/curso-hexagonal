# FASE 3 — Migraciones + e2e + Docs + Autoevaluación

> Detalle ejecutable de la Fase 3 del [SPEC-MAESTRA](SPEC-MAESTRA.md).
> **Creado:** 2026-10-15 11:02 · **Actualizado:** 2026-10-15 11:06 (Lima) · **Estado:** ✅ CERRADA (todos los gates en verde) · **Dueño:** José Gaspar

---

## 0. Objetivo de la fase

Dejar el proyecto **entregable**: esquema versionado, e2e contra base real, documentación
completa y la autoevaluación contra la rúbrica.

---

## 1. Qué se entregó

### 1.a Migraciones versionadas (`src/migrations/`)

| Migración | Crea |
|---|---|
| `1750000000000-CrearVacantes.ts` | `vacantes` + `saldos_creditos` (con `CHECK`s) |
| `1750000000001-CrearPostulaciones.ts` | `postulaciones` (con `FK` + `UNIQUE` + índice) |

- Ambas con **`up` y `down`**.
- `synchronize: false` en la app Y en el CLI (`src/config/data-source.ts`).
- `data-source.ts` usa la **misma** configuración de conexión que la app.

### 1.b e2e contra Postgres real (`test/flujo-completo.e2e-spec.ts`)

12 casos: crear, publicar (descuenta crédito), doble publicación (409), sin créditos (409),
postular, **contador cross-contexto = 1**, dedup por DNI (409), listar, 2× 404, 400 por
título corto, 400 por campo de más, 400 por DNI inválido. **(11 tests ejecutados: dos aserciones
400 van dentro del mismo test.)**
La app se arranca con `configurarApp()` — **la misma función que usa `main.ts`**.

### 1.c Documentación

- [`docs/reglas-negocio.md`](../../docs/reglas-negocio.md) — reglas + catálogo de errores.
- `README.md` completo: levantarlo, migraciones, endpoints, scripts, arquitectura.

---

## 2. Gates (evidencia REAL, 2026-10-15 11:06 Lima)

| Gate | Comando | Resultado |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | **0 errores** |
| Build | `pnpm build` | **OK** |
| Tests unitarios | `pnpm test` | **17 suites / 56 tests PASS** |
| Migraciones | `pnpm migration:run` | **✅ aplicadas** → 4 tablas (`migrations`, `vacantes`, `saldos_creditos`, `postulaciones`) |
| e2e | `pnpm test:e2e` | **✅ 11 tests PASS** contra Postgres real |
| Mutaciones | (ver §6) | **4 ROJAS** en Fases 1 y 2 |

### Cómo se corrió (reproducible)

```bash
docker compose up -d      # Postgres 16 en localhost:5433 (esperar a 'healthy')
cp .env.example .env      # credenciales del compose
pnpm migration:run        # crea las 4 tablas
pnpm test:e2e             # 11/11 en verde
```

**Nota de proceso:** el primer intento no se pudo ejecutar (Docker Desktop apagado y el
PostgreSQL local del puerto 5432 pedía una contraseña que no se tenía). Se levantó
Docker Desktop y se corrió por esa vía.

---

## 3. Autoevaluación contra la rúbrica (verificada con comandos, 2026-10-15 11:02)

| # | Criterio (pts) | Evidencia REAL | Estado |
|---|---|---|---|
| 1 | **Hexagonal y dependencias (15)** | `grep -rn "@nestjs\|typeorm\|class-validator" src/*/domain/` → **vacío**; `process.env` **solo** en `src/config/` | ✅ |
| 2 | **Modelo de dominio (15)** | 14 clases con `private constructor`; **0 setters** en `domain/`; la regla "publicar consume crédito" y el dedup viven en el dominio/handler | ✅ |
| 3 | **Puertos y adaptadores (15)** | 10 puertos (`Symbol`); **3 repos en memoria + 3 TypeORM + 3 mappers**; cambiar adaptador = 1 línea en el módulo | ✅ |
| 4 | **CQRS (10)** | 5 llamadas a `busDeComandos/Consultas.execute` en los controladores; comandos escriben, queries leen (`VacanteVista`, `PostulacionVista`) | ✅ |
| 5 | **Errores (10)** | `DomainException` con `code`+`kind`; **un único** `FiltroExcepcionesDominio`; catálogo == `docs/reglas-negocio.md` | ✅ |
| 6 | **Pruebas (10)** | Unit: **17 suites / 56 tests PASS**. e2e: **11/11 PASS** contra Postgres real | ✅ |
| 7 | **Persistencia (8)** | `synchronize: false` en app y CLI; **2 migraciones con `up`/`down`** aplicadas en vivo; `UNIQUE`/`FK`/`CHECK` creados en la base | ✅ |
| 8 | **Contextos y eventos (7)** | 2 contextos; `PostulacionEnviada` publicado **después** de persistir; listener en `vacantes/infrastructure/listeners/`; test de la cadena completa | ✅ |
| 9 | **Config y seguridad (5)** | `src/config/env.validation.ts` valida al arrancar (sin defaults peligrosos); `.env.example`; `.env` **gitignoreado**; sin secretos | ✅ |
| 10 | **Documentación (5)** | `README.md` + `docs/reglas-negocio.md` + 4 specs de fase; alguien ajeno levanta el proyecto leyendo solo el README | ✅ |

**Lo que falta para el 100%:** nada pendiente de ejecución. Los 10 criterios tienen evidencia
y su gate en verde.

---

## 4. Decisiones tomadas en esta fase

| Fecha-Hora | Decisión | Por qué |
|---|---|---|
| 2026-10-15 11:02 | Migraciones en `src/migrations/` (top-level) | El esquema es **compartido** por los dos contextos: no pertenece a uno solo |
| 2026-10-15 11:02 | Se agregaron `CHECK`s de estado/perfil además del `CHECK >= 0` del saldo | Que la base también impida datos imposibles, no solo el código |
| 2026-10-15 11:02 | `dotenv` como dependencia (solo para el CLI de migraciones) | El CLI necesita leer el `.env`; sin eso las migraciones irían a otra base |
| 2026-10-15 11:02 | `test/setup-e2e.ts` con `setupFiles` | Fija las variables del e2e **antes** de que se evalúe `AppModule` |
| 2026-10-15 11:02 | El e2e limpia y siembra el saldo en `beforeEach` | Tests independientes entre sí (sin orden implícito) |

---

## 5. Límites declarados

1. **El e2e NO está ejecutado.** Ver §2. Es el único punto del proyecto que no tiene
   evidencia verde propia.
2. **No hay seed automático.** El saldo de créditos se inserta a mano (el README trae el
   SQL). Un seed queda fuera del alcance del curso.
3. **Sin CI.** No se agregó GitHub Actions; el proyecto se entrega con los comandos
   manuales documentados en el README.
4. El `docs/` tiene los specs de las 3 fases + las reglas de negocio, pero **no** un ADR
   formal (decisión: la bitácora del SPEC-MAESTRA cumple ese rol).

---

## 6. Mutaciones ROJAS acumuladas (las 3 fases)

| # | Fase | Qué se rompió a propósito | Resultado |
|---|---|---|---|
| 1 | 1 | `publicar` sin descontar el crédito | **ROJO** (2 tests) |
| 2 | 1 | Quitar la guarda `VACANTE_YA_PUBLICADA` | **ROJO** (2 specs) |
| 3 | 2 | Quitar el dedup por DNI | **ROJO** |
| 4 | 2 | Publicar el evento ANTES de guardar | **ROJO** |

---

## 7. Checklist de aceptación de la fase

- [x] Migraciones con `up` y `down` (2)
- [x] App y CLI comparten configuración de conexión
- [x] `UNIQUE (vacante_id, documento_identidad)` + FK + índice + CHECKs
- [x] e2e escrito con la misma config que `main.ts`
- [x] `docs/reglas-negocio.md` con el catálogo completo
- [x] README autosuficiente
- [x] Autoevaluación con evidencia por criterio
- [x] **e2e ejecutado en verde** (11/11 contra Postgres real)
- [x] **Migraciones aplicadas** en vivo (4 tablas)

---

## 8. Cierre del proyecto

Las **3 fases están terminadas y verificadas**. El proyecto queda **entregable**:
`tsc` 0 · `nest build` OK · **17 suites / 56 tests unitarios** · **11 tests e2e** contra
Postgres real · migraciones aplicadas · 4 mutaciones ROJAS. De los 10 criterios de la
rúbrica, los 10 tienen evidencia.
