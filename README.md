# Vacante API

API REST para manejar **vacantes de trabajo** y las **postulaciones** que les llegan.
Proyecto final del curso de **NestJS + Arquitectura Hexagonal y DDD**.

> ⚠️ **Documentación en progreso.** El README se completa en la **Fase 3** (migraciones, e2e,
> `docs/reglas-negocio.md` y autoevaluación contra la rúbrica). Por ahora alcanza para levantarlo.

---

## Stack

NestJS 11 · TypeScript · TypeORM (`synchronize: false`) · PostgreSQL · Docker · pnpm · Jest

## Arquitectura

Hexagonal + DDD (táctico) + CQRS. Dos contextos acotados: **vacantes** y **postulaciones**.
Cada contexto se parte en `domain/` · `application/` · `infrastructure/`.

- `domain/` no conoce **nada** de afuera (ni Nest, ni TypeORM): entidades, value objects, puertos, eventos.
- `application/` son los casos de uso (comandos y queries) sobre los buses de CQRS.
- `infrastructure/` implementa los puertos (TypeORM + en memoria) y expone los controladores.

## Cómo levantarlo

```bash
pnpm install
cp .env.example .env        # completá las variables
docker compose up -d        # levanta Postgres en localhost:5433
pnpm start:dev              # arranca la API (default http://localhost:3000)
```

## Scripts

| Comando | Qué hace |
|---|---|
| `pnpm start:dev` | arranca en modo watch |
| `pnpm build` | compila a `dist/` |
| `pnpm test` | tests unitarios (sin base) |
| `pnpm test:e2e` | tests e2e (contra Postgres real) |

## Documentación

- [`docs/specs/SPEC-MAESTRA.md`](docs/specs/SPEC-MAESTRA.md) — el mapa completo del proyecto.
- [`docs/specs/FASE-1-vacantes.md`](docs/specs/FASE-1-vacantes.md) — lo entregado en la Fase 1.
- [`docs/specs/FASE-2-postulaciones.md`](docs/specs/FASE-2-postulaciones.md) — lo entregado en la Fase 2.

## Endpoints

| Método | Ruta | Qué hace |
|---|---|---|
| POST | `/vacantes` | Crear una vacante |
| POST | `/vacantes/:id/publicar` | Publicar (consume 1 crédito) |
| GET | `/vacantes/:id` | Ver una vacante |
| POST | `/vacantes/:id/postulaciones` | Postularse (dedup por DNI) |
| GET | `/vacantes/:id/postulaciones` | Listar postulaciones de la vacante |
