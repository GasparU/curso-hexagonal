# FASE 2 — Contexto POSTULACIONES + evento cross-contexto

> Detalle ejecutable de la Fase 2 del [SPEC-MAESTRA](SPEC-MAESTRA.md).
> **Creado:** 2026-10-15 10:59 (Lima) · **Estado:** ✅ CERRADA · **Dueño:** José Gaspar

---

## 0. Objetivo de la fase

Construir el **segundo contexto acotado** (`postulaciones`) con su regla estrella
(**mismo DNI + misma vacante = no se duplica**) y hacer que los dos contextos **se
comuniquen por un evento de dominio**, sin importarse el dominio entre sí.

---

## 1. Qué se entregó

### 1.a Núcleo compartido `src/comun/` (refactor de la Fase 1)

Por exigencia de la rúbrica (catálogo de errores ÚNICO + **UN solo filtro**, §9.1), lo
transversal se movió de `vacantes/` a `comun/`:

```
src/comun/
├── domain/        errors/domain.exception.ts · errors/error-codes.ts · evento-de-dominio.ts
│                  ports/ reloj · generador-id · publicador-eventos
└── infrastructure/ sistema-reloj · uuid-generador-id · nest-publicador-eventos
                    filters/domain-exception.filter.ts · comun.module.ts
```

`ComunModule` provee y exporta los 3 adaptadores transversales; cada contexto lo importa.
**Motivo:** si cada contexto tuviera su propia clase de error, el filtro único no las
atraparía → los errores de Postulaciones responderían 500 en vez de 400/404/409.

### 1.b Contexto `postulaciones` (nuevo)

```
src/postulaciones/
├── domain/
│   ├── entities/       postulacion.entity.ts
│   ├── value-objects/  postulacion-id · vacante-id · nombre-completo ·
│   │                   documento-identidad · correo-electronico · estado-postulacion
│   ├── events/         postulacion-enviada.event.ts
│   └── ports/          postulacion.repository.ts · consulta-de-vacantes.port.ts
├── application/
│   ├── commands/       postular/
│   └── queries/        listar-postulaciones-de-vacante/
└── infrastructure/
    ├── controllers/    postulaciones.controller.ts
    ├── dto/            postular.dto.ts
    ├── persistence/    orm/ · mappers/ · typeorm-postulacion.repository.ts · en-memoria/
    ├── adapters/       consulta-de-vacantes.adapter.ts
    └── postulaciones.module.ts
```

### 1.c El cruce entre contextos (§4 + §8)

```
POST /vacantes/:id/postulaciones
   → PostularHandler (postulaciones)
       ├─ ConsultaDeVacantes.existe()   ← puerto PROPIO, adaptador usa el repo de Vacantes
       ├─ dedup por DNI (POSTULANTE_YA_POSTULO)
       ├─ guarda la postulación
       └─ publica PostulacionEnviada  ──┐
                                        ▼
   VacantePostulacionListener (vacantes/infrastructure/listeners/)
       └─ vacante.registrarPostulacion()   ← suma el contador
```

- **Postulaciones NO importa el dominio de Vacantes.** Declara su puerto
  `ConsultaDeVacantes` y lo implementa `ConsultaDeVacantesAdapter` en infraestructura.
- **Vacantes NO importa el dominio de Postulaciones.** Su listener escucha el evento por
  **nombre** (`@OnEvent('PostulacionEnviada')`).
- El evento se publica **DESPUÉS** de persistir.

---

## 2. Rutas de la fase

| Método | Ruta | Caso de uso | Éxito |
|---|---|---|---|
| POST | `/vacantes/:id/postulaciones` | `Postular` (comando, dedup DNI) | 201 `{ id }` |
| GET | `/vacantes/:id/postulaciones` | `ListarPostulacionesDeVacante` (query) | 200 vista[] |

---

## 3. Gates (evidencia REAL, 2026-10-15 10:59 Lima)

| Gate | Comando | Resultado |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | **0 errores** |
| Build | `pnpm build` | **OK** |
| Tests unitarios | `pnpm test` | **17 suites / 56 tests PASS** |
| e2e | `pnpm test:e2e` | exit 0 (sin specs aún) |
| Mutación 1 (Fase 1) | `publicar` sin descontar crédito | **ROJO** |
| Mutación 2 (Fase 1) | quitar guarda `VACANTE_YA_PUBLICADA` | **ROJO** |
| Mutación 3 (Fase 2) | quitar el dedup por DNI | **ROJO** |
| Mutación 4 (Fase 2) | publicar el evento ANTES de guardar | **ROJO** |

Tras cada mutación se restauró el archivo y la suite volvió a **verde**.

---

## 4. Decisiones tomadas en esta fase

| Fecha-Hora | Decisión | Por qué |
|---|---|---|
| 2026-10-15 10:59 | Núcleo compartido `src/comun/` (errores, evento, reloj, ids, publicador, filtro) | §9.1 pide UN catálogo y UN filtro; §4 prohíbe que los contextos se importen entre sí |
| 2026-10-15 10:59 | Puerto `ConsultaDeVacantes` (cruzado) | §9.3: postular a una vacante inexistente es error de negocio (404), **nunca** 500 |
| 2026-10-15 10:59 | Postulaciones tiene su **propio** VO `VacanteId` | §8: los value objects NO se comparten entre contextos |
| 2026-10-15 10:59 | Entidad `Postulacion` **inmutable** (sin setters) | No hay workflow de estados en el alcance; se agrega después |
| 2026-10-15 10:59 | `VacantesModule` **exporta** `VACANTE_REPOSITORIO` | Es lo que necesita el adaptador de la consulta cruzada |

---

## 5. Límites declarados

1. **El dedup por DNI tiene DOS cerrojos, pero hoy corre uno.** El de código (handler) está
   activo; el de base (**UNIQUE `(vacante_id, documento_identidad)`**) recién existe cuando
   se aplique la migración de la **Fase 3**. La entidad ORM ya lo declara (`@Unique`) para
   que coincida con la migración, pero `synchronize: false` ⇒ la tabla todavía no lo tiene.
2. **El listener es "best-effort" si la vacante desapareció.** Si llega la postulación y la
   vacante ya no está, registra un `warn` y no rompe (la postulación ya se guardó). Es una
   carrera de borde, no el camino normal (el handler ya validó que existía).
3. **`test:e2e` sigue verde porque no tiene specs** (`passWithNoTests`). El e2e real contra
   Postgres es de la **Fase 3**.
4. **Sin migraciones ni seed.** La base todavía no tiene ninguna tabla.
5. **El workflow de estados de Postulación** (`EN_REVISION`/`RECHAZADA`/`CONTRATADA`) está
   modelado en el VO pero **no hay casos de uso** para moverlo (el spec lo marca opcional).

---

## 6. Checklist de aceptación

- [x] 2 contextos acotados, cada uno con 1 caso de escritura y 1 de lectura
- [x] Postulaciones NO importa el dominio de Vacantes (solo puerto + adaptador)
- [x] Evento de dominio en **pasado**, publicado DESPUÉS de persistir
- [x] Listener cross-contexto vive en `infrastructure/listeners/` de Vacantes
- [x] VOs no compartidos entre contextos
- [x] `domain/` de Postulaciones sin imports de `@nestjs/*` ni `typeorm`
- [x] Errores de negocio con `code`/`kind` (404 y 409 incluidos)
- [x] Tests unitarios sin Nest (handlers contra repos en memoria)
- [x] Test de la **cadena completa** del evento (sin Nest, con el publicador real)
- [x] Mutaciones ROJAS por aserción (2/2 en esta fase)

---

## 7. Próxima fase

**Fase 3 — Migraciones + e2e + Docs + autoevaluación** (`FASE-3-cierre.md`):
migraciones versionadas con `up`/`down` (incluida la UNIQUE del dedup y la FK), e2e contra
Postgres real arrancando con `configurarApp`, `docs/reglas-negocio.md`, README completo y
la autoevaluación contra los 10 criterios de la rúbrica.
