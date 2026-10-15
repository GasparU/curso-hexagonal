# Vacante API

API REST para manejar **vacantes de trabajo** y las **postulaciones** que les llegan.
Proyecto final del curso de **NestJS + Arquitectura Hexagonal y DDD**.

---

## Stack

NestJS 11 · TypeScript · TypeORM (`synchronize: false`) · PostgreSQL 16 · Docker · pnpm · Jest

## Cómo está armado

Hexagonal + DDD (táctico) + CQRS. Dos contextos acotados: **vacantes** y **postulaciones**.

```
src/
├── comun/           núcleo compartido (errores, reloj, ids, eventos, filtro único)
├── config/          único lugar que lee process.env
├── migrations/      esquema versionado (up / down)
├── vacantes/        contexto 1  →  domain/ · application/ · infrastructure/
└── postulaciones/   contexto 2  →  domain/ · application/ · infrastructure/
```

- `domain/` **no conoce nada de afuera**: sin `@nestjs/*`, sin `typeorm`, sin `class-validator`.
  Entidades, value objects, puertos, eventos, errores y servicios de dominio.
- `application/` son los casos de uso (comandos y queries) sobre los buses de CQRS.
- `infrastructure/` implementa los puertos (TypeORM + en memoria) y expone los controladores.

**Los contextos no se importan entre sí.** Postulaciones pregunta por una vacante con su
puerto `ConsultaDeVacantes` (implementado en infraestructura) y Vacantes reacciona al evento
`PostulacionEnviada` con un listener. Postulaciones publica el evento **después** de persistir.

## Requisitos

- Node 20+ y pnpm 10
- Docker (para la base) o un PostgreSQL propio

---

## Levantarlo desde cero

Los pasos van **en este orden**: los tests van antes de sembrar créditos (ver paso 5).

### 1. Dependencias

```bash
pnpm install
```

### 2. Variables de entorno

```bash
cp .env.example .env
```

En Windows (PowerShell): `Copy-Item .env.example .env`

El `.env.example` **ya trae los valores que coinciden con `docker-compose.yml`**
(usuario, clave y base `vacante`), así que no hay que tocar nada si vas a usar la
base de Docker. Si apuntás a tu propio PostgreSQL, ahí sí ajustá `DB_*`.

### 3. Levantar la base

```bash
docker compose up -d --wait
```

Levanta PostgreSQL 16 en **localhost:5433** y espera a que esté `healthy` antes de
seguir. El contenedor se llama **`vacante-postgres`**.

### 4. Aplicar las migraciones

```bash
pnpm migration:run
```

Crea las 4 tablas: `vacantes`, `saldos_creditos`, `postulaciones` y `migrations`.

### 5. Correr los tests

```bash
pnpm test        # 19 suites / 83 tests — sin base de datos
pnpm test:e2e    # 11 tests — contra la base real
```

> ⚠️ **Hacelo ANTES de sembrar los créditos.** El e2e usa la **misma base** que el
> desarrollo y consume el saldo (lo deja en 3). Si lo corrés después de sembrar,
> volvé a sembrar (paso 6) o vas a ver `409 CREDITOS_INSUFICIENTES` al publicar.

### 6. Sembrar créditos

Publicar consume un crédito y el saldo es **una fila única**. Para la demo alcanza
con sembrarla una vez:

```bash
docker exec -i vacante-postgres psql -U vacante -d vacante -c "INSERT INTO saldos_creditos (id, disponible) VALUES ('00000000-0000-4000-8000-000000000001', 10) ON CONFLICT (id) DO UPDATE SET disponible = 10;"
```

(usuario, base y clave salen de tu `.env`). Este paso es **solo para la demo**: la app
arranca igual sin la fila; lo que pasa es que publicar devuelve
`409 CREDITOS_INSUFICIENTES`.

### 7. Arrancar

```bash
pnpm start:dev
```

Escucha en `http://localhost:3000` (o el `PORT` de tu `.env`).

---

## Endpoints

| Método | Ruta | Qué hace | Éxito | Errores |
|---|---|---|---|---|
| POST | `/vacantes` | Crear una vacante | 201 `{ id }` | 400 validación |
| POST | `/vacantes/:id/publicar` | Publicar (consume 1 crédito) | 204 | 404 no existe · 409 ya publicada · 409 sin créditos |
| GET | `/vacantes/:id` | Ver una vacante | 200 | 404 no existe |
| POST | `/vacantes/:id/postulaciones` | Postularse | 201 `{ id }` | 400 validación · 404 vacante inexistente · 409 mismo DNI |
| GET | `/vacantes/:id/postulaciones` | Listar las postulaciones de la vacante | 200 | 404 vacante inexistente |

### `POST /vacantes`

```json
{
  "titulo": "Analista de datos",
  "descripcion": "Buscamos un analista con experiencia en SQL y reporting.",
  "perfilCargo": "PROFESIONAL"
}
```

`titulo` entre 5 y 120 caracteres · `descripcion` al menos 20 · `perfilCargo` es
`PROFESIONAL` u `OPERARIO`. Un campo de más (`forbidNonWhitelisted`) devuelve 400.

### `POST /vacantes/:id/publicar`

Sin cuerpo. Devuelve **204**.

### `POST /vacantes/:id/postulaciones`

```json
{
  "nombreCompleto": "Ana Pérez",
  "documentoIdentidad": "12345678",
  "correo": "ana@correo.com"
}
```

`nombreCompleto` entre 3 y 120 caracteres · `documentoIdentidad` son **8 dígitos** ·
`correo` con formato de correo. Mismo DNI en la misma vacante → **409**.

---

## Forma de las respuestas de error

Hay **dos formas**, según de dónde venga el error:

**Errores de negocio** (los que declara el dominio) llevan `code`:

```json
{ "statusCode": 404, "code": "VACANTE_NO_ENCONTRADA", "message": "No se encontró la vacante indicada." }
```

**Errores de validación del borde** (el DTO) los arma el framework y **no** llevan `code`;
`message` viene como lista:

```json
{
  "message": ["titulo must be longer than or equal to 5 characters"],
  "error": "Bad Request",
  "statusCode": 400
}
```

El catálogo completo de `code` está en [`docs/reglas-negocio.md`](docs/reglas-negocio.md).

---

## Probar que levantó

Una llamada y listo: si responde esto, la API está viva y el filtro de errores anda.

```bash
curl -s localhost:3000/vacantes/11111111-1111-4111-8111-111111111111
# {"statusCode":404,"code":"VACANTE_NO_ENCONTRADA","message":"No se encontró la vacante indicada."}
```

Y el **flujo completo** en 5 llamadas (crear → publicar → postular → ver → listar):

```bash
H='Content-Type: application/json'
ID=$(curl -s -X POST localhost:3000/vacantes -H "$H" \
  -d '{"titulo":"Analista de datos","descripcion":"Buscamos un analista con experiencia en SQL y reporting.","perfilCargo":"PROFESIONAL"}' \
  | python -c "import sys,json;print(json.load(sys.stdin)['id'])")

curl -s -o /dev/null -w "%{http_code}\n" -X POST localhost:3000/vacantes/$ID/publicar        # 204

curl -s -X POST localhost:3000/vacantes/$ID/postulaciones -H "$H" \
  -d '{"nombreCompleto":"Ana Perez","documentoIdentidad":"12345678","correo":"ana@correo.com"}'

curl -s localhost:3000/vacantes/$ID          # ojo: postulacionesRecibidas pasa a 1
curl -s localhost:3000/vacantes/$ID/postulaciones
```

Ese `postulacionesRecibidas: 1` es la prueba de que **el contador no lo escribe
Postulaciones**: sube por el evento, cruzando de contexto.

## Si algo sale mal

```bash
docker compose ps                 # ¿está el contenedor arriba y healthy?
docker compose logs -f postgres   # ¿qué dice la base?

# empezar de cero (borra los datos y el volumen)
docker compose down -v && docker compose up -d --wait && pnpm migration:run
```

- **Puerto 5433 ocupado**: cambiá el mapeo en `docker-compose.yml` y `DB_PORT` en tu `.env`.
- **`pnpm test:e2e` falla con "relation does not exist"**: te falta `pnpm migration:run`.

---

## Scripts

| Comando | Qué hace |
|---|---|
| `pnpm start:dev` | arranca en modo watch |
| `pnpm build` | compila a `dist/` |
| `pnpm test` | tests unitarios (**sin base de datos**) |
| `pnpm test:e2e` | tests e2e — requiere base levantada + migraciones, y **escribe en esa base** |
| `pnpm migration:run` | aplica las migraciones |
| `pnpm migration:revert` | revierte la última |
| `pnpm migration:show` | muestra el estado de las migraciones |

## Documentación

- [`docs/reglas-negocio.md`](docs/reglas-negocio.md) — las 18 reglas (`RN-001`…) con su estado, enlazadas al código + catálogo de errores.
- [`docs/decisiones-arquitectura.md`](docs/decisiones-arquitectura.md) — 14 ADR: por qué el proyecto está armado así.
- [`docs/specs/SPEC-MAESTRA.md`](docs/specs/SPEC-MAESTRA.md) — el mapa completo del proyecto.
- Fases: [`FASE-1-vacantes.md`](docs/specs/FASE-1-vacantes.md) · [`FASE-2-postulaciones.md`](docs/specs/FASE-2-postulaciones.md) · [`FASE-3-cierre.md`](docs/specs/FASE-3-cierre.md).
