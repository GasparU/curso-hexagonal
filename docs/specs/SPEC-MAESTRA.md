# SPEC MAESTRA — API de Vacantes y Postulaciones

> Proyecto final del curso **NestJS + Arquitectura Hexagonal y DDD**.
> Esta es la spec de trabajo: el mapa completo. Cada fase tiene su propio archivo en esta misma
> carpeta (`FASE-1-...`, `FASE-2-...`, `FASE-3-...`).
>
> **Creado:** 2026-10-14 17:46 (Lima) · **Estado:** borrador para revisión · **Dueño:** José Gaspar

---

## 0. Qué es esto (en dos líneas)

Una **API REST** para manejar vacantes de trabajo y las postulaciones que les llegan.
Está hecha con **arquitectura hexagonal**, **DDD táctico** y **CQRS**. El objetivo es clavarla en
los 100 puntos de la rúbrica.

**Regla de oro de esta spec:** el spec y el código se mueven **juntos**. Si el código cambia y
esto no, la tarea no cerró.

---

## 1. Restricciones de la rúbrica (lo que NO se puede romper)

### 1.1 Las 5 faltas GRAVES (si pasa una, ese criterio cae a nivel 1)

1. **Nada de decoradores de TypeORM** (`@Entity`, `@Column`) en entidades o value objects del dominio.
2. **Ningún archivo de `domain/` importa `@nestjs/*`** (ni `typeorm`, ni `class-validator`).
3. **El controlador NO toca el repositorio** — siempre pasa por un caso de uso.
4. **Sin contraseñas/hashes en respuestas o logs**, y **sin secretos commiteados**.
5. **Sin tests con `skip`** ni modificados para pasar sin explicar por qué.

### 1.2 Mínimos para que el proyecto sea evaluado

- `docker compose up -d` levanta la base.
- `pnpm test` y `pnpm test:e2e` **corren** (pueden fallar, pero tienen que correr).
- **Al menos 2 contextos acotados**, cada uno con **1 caso de escritura y 1 de lectura**.

### 1.3 Stack fijo

`NestJS` + `TypeScript` · `TypeORM` (con `synchronize: false`) · `PostgreSQL` · `Docker`
(`docker-compose.yml`) · `pnpm` · `Jest` (unit + e2e).

### 1.4 Lo que NO se evalúa (no perder tiempo acá)

- El dominio elegido (vale igual biblioteca que gimnasio).
- La cantidad de endpoints (importa un caso bien hecho, no diez a medias).
- El formato del código (Prettier, orden de imports), mientras se lea bien.

---

## 2. Dominio

Un sistema de **reclutamiento** con dos contextos:

- **Contexto Vacantes:** se crea una vacante, se publica (consume un crédito), se cierra.
- **Contexto Postulaciones:** alguien se postula a una vacante (con su DNI). El mismo DNI no puede
  postularse dos veces a la misma vacante.

La idea es reusar las **reglas reales** que ya tengo en mi sistema de reclutamiento, pero
reescritas limpias con arquitectura hexagonal (NO se copia el código viejo, que no es hexagonal).

---

## 3. Arquitectura (3 capas + regla de dependencias)

Cada contexto se parte en tres capas:

```
src/<contexto>/
├── domain/          <- el cerebro. No conoce NADA de afuera.
│   ├── entities/
│   ├── value-objects/
│   ├── events/
│   ├── errors/
│   └── ports/
├── application/     <- los casos de uso (comandos y queries). Depende de domain.
│   ├── commands/
│   └── queries/
└── infrastructure/  <- los adaptadores. Depende de application y domain.
    ├── controllers/
    ├── persistence/     (TypeORM + in-memory + mapper)
    └── listeners/
```

**La regla que se evalúa:** las dependencias apuntan **siempre hacia adentro**.
`infrastructure` → `application` → `domain`. Nunca al revés.

**Cómo lo comprueban:** `grep -rn "@nestjs\|typeorm\|class-validator" src/*/domain/` **debe salir vacío**.

---

## 4. Contextos acotados

| Contexto | Qué es dueño | Qué NO hace |
|---|---|---|
| **vacantes** | La vacante, su estado y el saldo de créditos | No sabe de postulantes |
| **postulaciones** | Las postulaciones (y el dedup por DNI) | No importa nada del dominio de vacantes |

**Regla:** los contextos **no se importan** entre sí desde `domain/`. Si uno necesita algo del otro,
declara un puerto propio y lo implementa un adaptador en `infrastructure/`.

Se comunican por **eventos de dominio** (ver §8).

---

## 5. Modelo de dominio

### 5.1 Contexto VACANTES

**Entidad `Vacante` (raíz del agregado)**

- Identidad: `VacanteId`.
- Campos: `Titulo` (VO), `Descripcion` (VO), `PerfilCargo` (VO), `EstadoVacante` (VO),
  `CreadaEn`, `PublicadaEn`, `CerradaEn`, `PostulacionesRecibidas` (número, arranca en 0).
- **Comportamiento (nada de setters):**
  - `crear(titulo, descripcion, perfil)` → nace en `BORRADOR`.
  - `publicar(saldo)` → pasa a `PUBLICADA` y descuenta el crédito. Si ya está publicada, tira error.
  - `registrarPostulacion()` → suma 1 al contador (lo llama el listener).
  - `cerrar()` → pasa a `CERRADA` (desde acá no se vuelve).

**Invariantes (viven en la entidad)**

- Una vacante **nace en BORRADOR**. No se puede volver a BORRADOR (regla mía del sistema real).
- No se puede publicar dos veces (si ya está `PUBLICADA` → `CONFLICT`).
- No se puede cerrar una vacante que está en `BORRADOR`.

**Value Objects del contexto**

| VO | Valida / normaliza |
|---|---|
| `VacanteId` | UUID válido. Tiene `generar()` y `equals()`. |
| `Titulo` | No vacío, 5–120 caracteres. Recorta espacios. |
| `Descripcion` | Mínimo 20 caracteres. |
| `PerfilCargo` | Solo `PROFESIONAL` u `OPERARIO`. |
| `EstadoVacante` | Solo `BORRADOR`, `PUBLICADA`, `CERRADA`. |
| `SaldoCreditos` | Entero ≥ 0. `descontar()` tira error si no alcanza. |

**Eventos de dominio (`domain/events/`)**

- `VacantePublicada` (cuando pasa a PUBLICADA).
- `VacanteCerrada`.

**Regla mía que se conserva:** **publicar consume un crédito**. Si no hay saldo → `CREDITOS_INSUFICIENTES`.

### 5.2 Contexto POSTULACIONES

**Entidad `Postulacion` (raíz del agregado)**

- Identidad: `PostulacionId`.
- Campos: `VacanteId` (VO de referencia), `NombreCompleto` (VO), `DocumentoIdentidad` (VO),
  `CorreoElectronico` (VO), `EstadoPostulacion` (VO), `CreadaEn`.
- **Comportamiento:**
  - `registrar(vacanteId, nombre, documento, correo)` → nace en `RECIBIDA`.
  - `enRevision()` (por si después se agrega workflow, opcional).

**Invariante clave (dedup, regla mía del sistema real)**

- **Mismo DNI + misma vacante = no se duplica.** La segunda intentona → `POSTULANTE_YA_POSTULO`.

**Value Objects del contexto**

| VO | Valida / normaliza |
|---|---|
| `PostulacionId` | UUID válido. |
| `DocumentoIdentidad` | DNI peruano: **8 dígitos**. Sin letras. |
| `NombreCompleto` | 3–120 caracteres. |
| `CorreoElectronico` | Formato de correo válido. |
| `EstadoPostulacion` | `RECIBIDA` / `EN_REVISION` / `RECHAZADA` / `CONTRATADA`. |

**Evento de dominio**

- `PostulacionEnviada` (se publica DESPUÉS de guardar, en pasado).

---

## 6. Puertos y adaptadores

### 6.1 Puertos (en `domain/ports/`, inyectados por **token `Symbol`**)

| Puerto (contexto) | Firma (mínima) |
|---|---|
| `VacanteRepositorio` (vacantes) | `guardar(vacante)`, `buscarPorId(id)`, `existePorTitulo(titulo)` |
| `SaldoCreditosRepositorio` (vacantes) | `obtener()`, `guardar(saldo)` |
| `PostulacionRepositorio` (postulaciones) | `guardar(postulacion)`, `buscarPorId(id)`, `existePorVacanteYDocumento(vacanteId, doc)`, `listarPorVacante(vacanteId)` |
| `PublicadorDeEventos` (ambos) | `publicar(eventos)` |
| `Reloj` (ambos) | `ahora()` |
| `GeneradorDeId` (ambos) | `generar()` |

### 6.2 Adaptadores

- **Repositorio EN MEMORIA** (para los tests unitarios): `VacanteRepositorioEnMemoria`, etc.
- **Repositorio REAL (TypeORM)**: `TypeOrmVacanteRepositorio`, etc.
- **La entidad del ORM es OTRA clase**: `VacanteOrmEntity` ≠ `Vacante` del dominio.
- **Un mapper traduce**: `VacanteMapper.aDominio(orm)` / `VacanteMapper.aPersistencia(vacante)`.
- El adaptador **traduce datos, no semántica**: no repite reglas del caso de uso. Cuando no
  encuentra algo → devuelve `null`, no lanza excepción.

---

## 7. Casos de uso y CQRS

Cada caso de uso vive en **su propia carpeta**, con el nombre de la acción (`crear/`, `publicar/`).

| Tipo | Caso de uso | Contexto | Ruta |
|---|---|---|---|
| **Comando** | `CrearVacante` | vacantes | `POST /vacantes` |
| **Comando** | `PublicarVacante` (consume crédito) | vacantes | `POST /vacantes/:id/publicar` |
| **Query** | `ObtenerVacante` | vacantes | `GET /vacantes/:id` |
| **Comando** | `Postular` (dedup DNI) | postulaciones | `POST /vacantes/:id/postulaciones` |
| **Query** | `ListarPostulacionesDeVacante` | postulaciones | `GET /vacantes/:id/postulaciones` |

**Reglas de CQRS que se evalúan:**

- Los **comandos escriben**, las **queries leen**. Una query NUNCA modifica estado.
- El **controlador publica en `CommandBus` / `QueryBus`** — no llama a handlers ni a repositorios.
- El **handler orquesta**: carga, delega en el dominio, persiste y publica eventos.
  **No contiene reglas de negocio** (esas viven en las entidades / VOs).

---

## 8. Contextos acotados y eventos

- **Dos contextos** con separación justificada (§4).
- **`PostulacionEnviada`** lo emite el contexto Postulaciones **después de persistir**.
- El **oyente** de ese evento vive en `infrastructure/listeners/` del contexto **Vacantes**
  (porque viene de otro contexto) y ejecuta `vacante.registrarPostulacion()`.
- Los **value objects NO se comparten** entre contextos.
- Los eventos son **clases planas** en `domain/events/`, con **nombre en pasado**.

---

## 9. Manejo de errores y validación

### 9.1 Errores de dominio

- Los errores de negocio son **`DomainException`** con:
  - `code` estable (contrato con el cliente), ej. `CREDITOS_INSUFICIENTES`.
  - `kind`: `VALIDATION` | `NOT_FOUND` | `CONFLICT`.
- **El dominio NO conoce los códigos HTTP.**
- **Un ÚNICO filtro de infraestructura** traduce `kind` → HTTP y cubre todos los tipos.

### 9.2 Catálogo de errores (`docs/reglas-negocio.md` lo repite)

| `code` | `kind` | HTTP |
|---|---|---|
| `TITULO_INVALIDO` | VALIDATION | 400 |
| `DESCRIPCION_MUY_CORTA` | VALIDATION | 400 |
| `PERFIL_CARGO_INVALIDO` | VALIDATION | 400 |
| `DNI_INVALIDO` | VALIDATION | 400 |
| `CORREO_INVALIDO` | VALIDATION | 400 |
| `VACANTE_NO_ENCONTRADA` | NOT_FOUND | 404 |
| `VACANTE_YA_PUBLICADA` | CONFLICT | 409 |
| `VACANTE_YA_CERRADA` | CONFLICT | 409 |
| `CREDITOS_INSUFICIENTES` | CONFLICT | 409 |
| `POSTULANTE_YA_POSTULO` | CONFLICT | 409 |

### 9.3 Validación en DOS niveles

1. **Borde:** DTO + `ValidationPipe` con `whitelist` y `forbidNonWhitelisted`.
2. **Dominio:** el Value Object vuelve a validar (aunque el DTO ya lo haya hecho).

**Un error de negocio NUNCA responde 500.**

---

## 10. Persistencia y migraciones

- `synchronize: false` en **todos** los entornos.
- El esquema sale de **migraciones versionadas** (con `up` y `down`).
- La app y el CLI de migraciones **comparten la misma config** de conexión.
- `docker-compose.yml` levanta Postgres local.

**Tablas mínimas**

| Tabla | Campos clave |
|---|---|
| `vacantes` | `id` (uuid pk), `titulo`, `descripcion`, `perfil_cargo`, `estado`, `creada_en`, `publicada_en`, `cerrada_en`, `postulaciones_recibidas` |
| `saldos_creditos` | `id`, `disponible` (int, con `CHECK >= 0`) |
| `postulaciones` | `id` (uuid pk), `vacante_id` (FK → vacantes), `documento_identidad`, `nombre_completo`, `correo`, `estado`, `creada_en` |

**Reglas que solo la base garantiza:**

- **UNIQUE `(vacante_id, documento_identidad)`** → el dedup por DNI queda también en la base.
- **FK** `postulaciones.vacante_id` → `vacantes.id`.
- Índice por `vacante_id`.

---

## 11. Configuración y seguridad

- Las variables de entorno **se validan al arrancar**: si falta una, **la app no levanta**.
  Ninguna con default peligroso (nada de `localhost` por defecto).
- **Solo la carpeta `src/config/` lee `process.env`.** El resto usa `ConfigService`.
- El repo trae **`.env.example`** actualizado. **`.env` y los secretos NO se versionan.**
- No hay contraseñas ni hashes en respuestas HTTP ni en logs (en este alcance no hay auth, pero
  la regla queda escrita para que no se rompa).

**Variables:** `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `PORT`.

---

## 12. Pruebas

- **Unitarias** (sin Nest, sin base): value objects, entidades y handlers.
  El handler se instancia **a mano** contra el **repositorio en memoria**.
- **e2e** contra **Postgres real**, arrancando la app con la **misma función de configuración
  que `main.ts`**.
- Se prueban **casos felices y de error** (400, 404, 409).
- Al entregar: **`pnpm test` y `pnpm test:e2e` en VERDE**.

---

## 13. Mapeo criterio → dónde vive (autoevaluación)

| # | Criterio (pts) | Dónde vive | Cómo se comprueba |
|---|---|---|---|
| 1 | Hexagonal y dependencias (15) | `src/*/domain|application|infrastructure` | `grep -rn "@nestjs\|typeorm" src/*/domain/` → vacío |
| 2 | Modelo de dominio (15) | `domain/entities`, `domain/value-objects` | VOs con constructor privado; entidades sin setters |
| 3 | Puertos y adaptadores (15) | `domain/ports`, `infrastructure/persistence` | 2 adaptadores + mapper; cambiar adaptador = 1 línea |
| 4 | CQRS (10) | `application/commands`, `application/queries` | controlador usa `CommandBus`/`QueryBus` |
| 5 | Errores (10) | `domain/errors`, filtro en `infrastructure` | catálogo coincide con el código |
| 6 | Pruebas (10) | `test/` y `*.spec.ts` | todo verde; unit sin Nest; e2e con la base real |
| 7 | Persistencia (8) | `infrastructure/persistence`, `migrations/` | `synchronize:false`; migraciones con `up`/`down` |
| 8 | Contextos y eventos (7) | 2 contextos + `domain/events` + `listeners` | evento publicado después de guardar |
| 9 | Config y seguridad (5) | `src/config` | `process.env` solo ahí; `.env.example` |
| 10 | Documentación (5) | `README.md`, `docs/` | alguien ajeno levanta el proyecto leyendo solo esto |

---

## 14. Fases

| Fase | Nombre | Archivo |
|---|---|---|
| **1** | Esqueleto + Contexto **Vacantes** | `FASE-1-vacantes.md` |
| **2** | Contexto **Postulaciones** + evento cross-context | `FASE-2-postulaciones.md` |
| **3** | Migraciones + e2e + Docs + autoevaluación | `FASE-3-cierre.md` |

---

## 15. Fuera de alcance (a propósito)

- **Nada de IA / LangChain / lectura de CVs** → no aporta al alcance y agrega fragilidad.
- **Nada de auth/JWT** → no lo pide esta rúbrica (dejo la regla de "sin secretos" escrita igual).
- **Nada de frontend.**
- **Nada de microservicios reales** → son 2 contextos en un solo proceso, comunicados por eventos.
- Match, bolsa de talento, notificaciones, etc. → quedan para después del curso, si me interesa.

---

## 16. Estilo del código (para que se vea mío de verdad)

- Los **nombres van en español** (entidades, métodos, variables). El framework va en inglés
  (`@Injectable`, `Repository`, `CommandBus`), que es normal.
- **Pocos comentarios**, cortos y en mi voz. Ejemplos:
  - `// si ya existe el DNI en la vacante, no lo duplicamos`
  - `// ojo: el cierre no borra, solo cambia de estado`
- **Nada de comentarios tipo "// TODO: implementar según requerimientos"** (eso grita "de fábrica").
- Consistencia antes que cantidad.

---

## 17. Bitácora de decisiones (se llena al vuelo)

| Fecha-Hora | Decisión | Por qué |
|---|---|---|
| 2026-10-14 17:46 | Dominio = Vacantes + Postulaciones | Reúso mis reglas reales y las puedo defender |
| 2026-10-14 17:46 | Créditos DENTRO de Vacantes (no 3er contexto) | 2 contextos alcanzan para el criterio 8 |
| 2026-10-14 17:46 | Sin IA/LangChain en el proyecto | No aporta al alcance y agrega fragilidad |
| 2026-10-15 10:31 | Fase 1 cerrada: esqueleto + contexto Vacantes (3 casos de uso, 32 tests) | Ver `FASE-1-vacantes.md` |
| 2026-10-15 10:31 | Se agregaron 4 codigos de error (ID/ESTADO/SALDO invalidos + VACANTE_NO_PUBLICADA) | Los necesitaban el UUID, el estado, el saldo y cerrar-en-borrador |
| 2026-10-15 10:31 | `existePorTitulo` queda declarado SIN uso | El spec lo lista como puerto pero no define la regla de titulo unico |
| 2026-10-15 10:59 | Nucleo compartido `src/comun/` (errores, evento, reloj, ids, publicador, filtro) | §9.1 pide UN catalogo y UN filtro; §4 prohibe que los contextos se importen |
| 2026-10-15 10:59 | Fase 2 cerrada: contexto Postulaciones + evento cross-contexto (dedup DNI) | Ver `FASE-2-postulaciones.md` |
| 2026-10-15 10:59 | Puerto `ConsultaDeVacantes` para el cruce entre contextos | §9.3: postular a una vacante inexistente es 404, nunca 500 |
| 2026-10-15 11:02 | Fase 3: migraciones (up/down) + e2e + reglas de negocio + README + autoevaluacion | Ver `FASE-3-cierre.md`. El e2e quedo SIN ejecutar (no habia base levantada) |
| 2026-10-15 11:02 | Migraciones en `src/migrations/` (top-level) | El esquema es compartido por los 2 contextos |
