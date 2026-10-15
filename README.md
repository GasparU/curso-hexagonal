# Vacante API

API REST para manejar **vacantes de trabajo** y las **postulaciones** que les llegan.
Proyecto final del curso de **NestJS + Arquitectura Hexagonal y DDD**.

---

## Stack

NestJS 11 · TypeScript · TypeORM (`synchronize: false`) · PostgreSQL · Docker · pnpm · Jest

## Arquitectura

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
  Entidades, value objects, puertos, eventos y errores.
- `application/` son los casos de uso (comandos y queries) sobre los buses de CQRS.
- `infrastructure/` implementa los puertos (TypeORM + en memoria) y expone los controladores.

**Los contextos no se importan entre sí.** Postulaciones pregunta por una vacante con su
puerto `ConsultaDeVacantes` (implementado en infraestructura) y Vacantes reacciona al evento
`PostulacionEnviada` con un listener. Postulaciones publica el evento **después** de persistir.

## Requisitos

- Node 20+ y pnpm
- PostgreSQL (con Docker, o uno local)

## Cómo levantarlo

```bash
pnpm install
cp .env.example .env          # completá las variables (o ajustalas a tu base)

docker compose up -d          # levanta Postgres local en localhost:5433
pnpm migration:run            # crea las tablas (vacantes, saldos_creditos, postulaciones)

pnpm start:dev                # arranca la API (default http://localhost:3000)
```

> **Sin saldo no se puede publicar.** `saldos_creditos` es una fila única (singleton).
> Para la demo alcanza con insertar créditos una vez:
>
> ```sql
> INSERT INTO saldos_creditos (id, disponible)
> VALUES ('00000000-0000-4000-8000-000000000001', 10)
> ON CONFLICT (id) DO UPDATE SET disponible = 10;
> ```

## Endpoints

| Método | Ruta | Qué hace | Éxito |
|---|---|---|---|
| POST | `/vacantes` | Crear una vacante | 201 `{ id }` |
| POST | `/vacantes/:id/publicar` | Publicar (consume 1 crédito) | 204 |
| GET | `/vacantes/:id` | Ver una vacante | 200 |
| POST | `/vacantes/:id/postulaciones` | Postularse (dedup por DNI) | 201 `{ id }` |
| GET | `/vacantes/:id/postulaciones` | Listar postulaciones de la vacante | 200 |

Los errores de negocio devuelven `{ statusCode, code, message }` (ver
[`docs/reglas-negocio.md`](docs/reglas-negocio.md)).

## Scripts

| Comando | Qué hace |
|---|---|
| `pnpm start:dev` | arranca en modo watch |
| `pnpm build` | compila a `dist/` |
| `pnpm test` | tests unitarios (sin base de datos) |
| `pnpm test:e2e` | tests e2e (**requiere** base levantada + migraciones) |
| `pnpm migration:run` | aplica las migraciones |
| `pnpm migration:revert` | revierte la última migración |
| `pnpm migration:show` | muestra el estado de las migraciones |

## Documentación

- [`docs/specs/SPEC-MAESTRA.md`](docs/specs/SPEC-MAESTRA.md) — el mapa completo del proyecto.
- [`docs/reglas-negocio.md`](docs/reglas-negocio.md) — reglas de negocio + catálogo de errores.
- [`docs/specs/FASE-1-vacantes.md`](docs/specs/FASE-1-vacantes.md) — Fase 1.
- [`docs/specs/FASE-2-postulaciones.md`](docs/specs/FASE-2-postulaciones.md) — Fase 2.
- [`docs/specs/FASE-3-cierre.md`](docs/specs/FASE-3-cierre.md) — Fase 3 + autoevaluación.
