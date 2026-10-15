# FASE 3 — Migraciones + e2e + Docs + Autoevaluación

> Detalle ejecutable de la Fase 3 del [SPEC-MAESTRA](SPEC-MAESTRA.md).
> **Creado:** 2026-10-15 11:02 · **Actualizado:** 2026-10-15 11:19 (Lima) · **Estado:** ✅ CERRADA + revisada contra la rúbrica real (ver §9) · **Dueño:** José Gaspar

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

- [`docs/reglas-negocio.md`](../reglas-negocio.md) — reglas con id estable (`RN-001`…), enlazadas a `archivo:línea` + catálogo de errores.
- [`docs/decisiones-arquitectura.md`](../decisiones-arquitectura.md) — 14 ADR con el porqué de cada decisión.
- `README.md` completo: levantarlo, migraciones, endpoints, scripts, arquitectura.

### 1.d Servicio de dominio

`postulaciones/domain/services/registro-de-postulaciones.ts`: las dos reglas que no
pertenecen a una sola entidad (no duplicar por DNI, no postular a una vacante
inexistente). Depende de **puertos**, no de repositorios; el módulo lo arma con
`useFactory`. Es lo que deja al handler sin ninguna regla de negocio.

---

## 2. Gates (evidencia REAL, 2026-10-15 11:06 Lima)

| Gate | Comando | Resultado |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | **0 errores** |
| Build | `pnpm build` | **OK** |
| Tests unitarios | `pnpm test` | **19 suites / 83 tests PASS** |
| Migraciones | `pnpm migration:run` | **✅ aplicadas** → 4 tablas (`migrations`, `vacantes`, `saldos_creditos`, `postulaciones`) |
| e2e | `pnpm test:e2e` | **✅ 11 tests PASS** contra Postgres real |
| Mutaciones | (ver §6) | **9 ROJAS** |

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
| 2 | **Modelo de dominio (15)** | 14 clases con `private constructor`; **0 setters** en `domain/`; las 2 entidades tienen `toPrimitives()`/`fromPrimitives()` y **`fromPrimitives` re-valida**; las reglas están en el dominio (hay un **servicio de dominio**, ver §9) | ✅ |
| 3 | **Puertos y adaptadores (15)** | **7 puertos** (+ el servicio de dominio) inyectados por `Symbol`; **3 repos en memoria + 3 TypeORM + 3 mappers**; cambiar adaptador = 1 línea en el módulo | ✅ |
| 4 | **CQRS (10)** | 5 llamadas a `busDeComandos/Consultas.execute` en los controladores; comandos escriben, queries leen (`VacanteVista`, `PostulacionVista`) | ✅ |
| 5 | **Errores (10)** | `DomainException` con `code`+`kind`; **un único** `FiltroExcepcionesDominio`; catálogo == `docs/reglas-negocio.md` | ✅ |
| 6 | **Pruebas (10)** | Unit: **19 suites / 83 tests PASS**. e2e: **11/11 PASS** contra Postgres real. El catálogo de errores **entero** tiene prueba (15 códigos) con un candado que falla si se agrega uno sin probar | ✅ |
| 7 | **Persistencia (8)** | `synchronize: false` en app y CLI; **2 migraciones con `up`/`down`** aplicadas en vivo; `UNIQUE`/`FK`/`CHECK` creados en la base | ✅ |
| 8 | **Contextos y eventos (7)** | 2 contextos; las **entidades REGISTRAN** sus eventos (`tomarEventos()`) y el caso de uso los publica **después** de persistir; listener en `vacantes/infrastructure/listeners/`; test de la cadena completa | ✅ |
| 9 | **Config y seguridad (5)** | `src/config/env.validation.ts` valida al arrancar (sin defaults peligrosos); `.env.example`; `.env` **gitignoreado**; sin secretos | ✅ |
| 10 | **Documentación (5)** | `README.md` + `docs/reglas-negocio.md` (ids `RN-001`… enlazados a `archivo:línea`) + **`docs/decisiones-arquitectura.md`** (14 ADR con el porqué y la alternativa descartada) + 4 specs de fase | ✅ |

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

## 6. Mutaciones ROJAS acumuladas

Romper a propósito y ver el rojo: si el test no se pone rojo, no estaba probando nada.

| # | Fase | Qué se rompió a propósito | Resultado |
|---|---|---|---|
| 1 | 1 | `publicar` sin descontar el crédito | **ROJO** (2 tests) |
| 2 | 1 | Quitar la guarda `VACANTE_YA_PUBLICADA` | **ROJO** (2 specs) |
| 3 | 2 | Quitar el dedup por DNI | **ROJO** |
| 4 | 2 | Publicar el evento ANTES de guardar | **ROJO** |
| 5 | 3 | La entidad NO registra el evento al publicar | **ROJO** (1 test) |
| 6 | 3 | `fromPrimitives` NO vuelve a validar el estado | **ROJO** (3 tests) |
| 7 | 3 | El servicio de dominio NO chequea el duplicado | **ROJO** (1 test) |
| 8 | 3 | Agregar un código NUEVO al catálogo sin su prueba | **ROJO** (el candado lo caza) |
| 9 | 3 | Invertir el ORDEN de las validaciones del servicio | **ROJO** (1 test) |

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
- [x] Las entidades exponen `toPrimitives()`/`fromPrimitives()` y **`fromPrimitives` re-valida**
- [x] Las entidades **registran** sus eventos; el caso de uso los publica después de persistir
- [x] Las reglas que no son de una sola entidad viven en un **servicio de dominio**
- [x] **Todo el catálogo de errores** (15 códigos) tiene prueba + candado anti-olvido
- [x] Reglas de negocio con **id estable** (`RN-001`…) enlazadas a `archivo:línea`
- [x] **ADR** con el porqué de cada decisión (`docs/decisiones-arquitectura.md`)

---

## 8. Cierre del proyecto

Las **3 fases están terminadas y verificadas**. El proyecto queda **entregable**:
`tsc` 0 · `nest build` OK · **19 suites / 83 tests unitarios** · **11 tests e2e** contra
Postgres real · migraciones aplicadas · **9 mutaciones ROJAS**. De los 10 criterios de
la rúbrica, los 10 tienen evidencia (ver §9).

---

## 9. Revisión contra la RÚBRICA REAL (2026-10-15 11:19)

Se releyó la rúbrica del curso (`rubrica-proyecto-final.pdf`) porque el `SPEC-MAESTRA`
—que había sido escrito antes— **no había transcripto todos los requisitos**. Aparecieron
6 huecos. **Todos cerrados en la misma jornada:**

| # | Lo que pide la rúbrica (textual) | Qué se hizo | Criterios que protege |
|---|---|---|---|
| **H1** | *"La entidad sale del dominio como primitivos (`toPrimitives()`/`fromPrimitives()`), y fromPrimitives vuelve a validar"* | Las 2 entidades exponen el par; `fromPrimitives` reconstruye los value objects (si el dato está corrupto, **falla**) | 2 |
| **H2** | *"La entidad registra los eventos y el caso de uso los publica"* | `_eventos` + `tomarEventos()` en ambas entidades; los handlers publican **después** de guardar | 8 |
| **H3** | *"El handler orquesta… No contiene reglas de negocio"* (nivel 3: *"alguna regla quedó en el caso de uso"*) | Las 2 reglas que estaban en el handler pasaron a `RegistroDePostulaciones` (servicio de dominio) | 2 · 4 |
| **H4** | *"Todas las reglas del dominio y todos los errores tienen prueba"* (nivel 3: *"faltan casos de error"*) | `errores-de-dominio.spec.ts`: 15 códigos provocados **por el camino real** + candado que falla si se agrega uno sin su prueba | 6 |
| **H5** | *"Reglas de negocio con un id estable (`RN-001`…) y su estado, enlazadas al código que las implementa"* | `reglas-negocio.md` reescrito: 18 reglas `RN-001`… con columnas **Estado** · **Dónde vive** · **Prueba** | 10 |
| **H6** | *"Carpeta docs/ con las reglas de negocio y las decisiones de arquitectura"* | `docs/decisiones-arquitectura.md`: **14 ADR**, cada uno con el porqué, la alternativa descartada y el costo | 10 |

**Verificación de que H4 no es un espejo:** el candado se probó rompiéndolo — se agregó
un código inventado al catálogo y el test **se puso rojo** (mutación #8).

### Lo que la rúbrica deja afuera (y no hay que perseguir)

La rúbrica dice explícitamente qué **no** se evalúa: el dominio elegido, la cantidad de
endpoints y el formato del código (Prettier, orden de imports).

### El puntaje: cómo se calcula

**Puntaje del criterio = puntos × nivel ÷ 4.** El nivel **4 (Excelente)** se da cuando
además *"se nota que entiende por qué se hace así"*. O sea: cumplir los requisitos pone
el criterio en **nivel 3 (75%)**; el 25% restante lo otorga la persona que corrige al ver
que el autor **entiende** el diseño. Por eso ningún documento puede prometer un 100:
los 6 huecos de arriba eran lo que **impedía llegar al nivel m\u00e1s alto** en 5 criterios
(47 puntos); cerrados, el techo deja de ser 3. Lo que queda es defender el porqué.
