# Reglas de negocio

> Cada regla tiene un **id estable** (`RN-001`) que no se renumera nunca: si una
> regla se da de baja, queda marcada como *Derogada* con la fecha. La columna
> **Dónde vive** apunta al código que la implementa, y **Prueba** al test que la
> verifica.
> **Actualizado:** 2026-10-15 (Lima) · Dueño: José Gaspar

El porqué de las decisiones de diseño está en
[`decisiones-arquitectura.md`](decisiones-arquitectura.md).

---

## 1. Contexto VACANTES

| ID | Regla | Estado | Dónde vive | Prueba |
|---|---|---|---|---|
| **RN-001** | Una vacante **nace en BORRADOR**, sin fechas de publicación ni cierre y con 0 postulaciones | Vigente | `vacante.entity.ts:51` (`crear`) | `vacante.entity.spec.ts` |
| **RN-002** | **Publicar consume un crédito** y devuelve el saldo restante (el saldo es inmutable: se devuelve uno nuevo) | Vigente | `vacante.entity.ts:108` · `saldo-creditos.vo.ts:17` | `vacante.entity.spec.ts` · `publicar-vacante.handler.spec.ts` |
| **RN-003** | Una vacante **ya publicada no se vuelve a publicar** (`VACANTE_YA_PUBLICADA`) y **no descuenta otro crédito** | Vigente | `vacante.entity.ts:113` | `vacante.entity.spec.ts` · `flujo-completo.e2e-spec.ts` |
| **RN-004** | **No se cierra una vacante en BORRADOR** (`VACANTE_NO_PUBLICADA`): primero hay que publicarla | Vigente | `vacante.entity.ts:134` | `vacante.entity.spec.ts` · `errores-de-dominio.spec.ts` |
| **RN-005** | Una vacante **cerrada no se reabre ni se vuelve a cerrar** (`VACANTE_YA_CERRADA`): no hay transición hacia atrás | Vigente | `vacante.entity.ts:110,131` | `vacante.entity.spec.ts` |
| **RN-006** | **Sin saldo no se publica** (fail-closed: si no hay fila de saldo se asume cero) | Vigente | `publicar-vacante.handler.ts:39` | `publicar-vacante.handler.spec.ts` |
| **RN-007** | El saldo de créditos **nunca es negativo** ni fraccionario | Vigente | `saldo-creditos.vo.ts:6` · `migrations/1750000000000:34` (`CHECK`) | `saldo-creditos.vo.spec.ts` |
| **RN-008** | El **contador de postulaciones** de una vacante lo sube el evento que llega del otro contexto (no lo escribe Postulaciones) | Vigente | `vacante.entity.ts:124` · `vacante-postulacion.listener.ts:18,28` | `vacante-postulacion.listener.spec.ts` · `flujo-completo.e2e-spec.ts` |

## 2. Contexto POSTULACIONES

| ID | Regla | Estado | Dónde vive | Prueba |
|---|---|---|---|---|
| **RN-009** | Una postulación **nace en RECIBIDA** | Vigente | `postulacion.entity.ts:42` (`registrar`) | `postulacion.entity.spec.ts` |
| **RN-010** | El **DNI son exactamente 8 dígitos** (se recortan los espacios) | Vigente | `documento-identidad.vo.ts:11` | `documento-identidad.vo.spec.ts` |
| **RN-011** | **Mismo DNI + misma vacante = no se duplica** (`POSTULANTE_YA_POSTULO`) | Vigente | `registro-de-postulaciones.ts:30` · `migrations/1750000000001:22` (`UNIQUE`) | `registro-de-postulaciones.spec.ts` · `flujo-completo.e2e-spec.ts` |
| **RN-012** | **No se postula a una vacante que no existe** (`VACANTE_NO_ENCONTRADA`, no un 500) | Vigente | `registro-de-postulaciones.ts:26` | `registro-de-postulaciones.spec.ts` · `flujo-completo.e2e-spec.ts` |
| **RN-013** | Toda postulación **apunta a una vacante real** | Vigente | `migrations/1750000000001:21` (`FOREIGN KEY`) | `flujo-completo.e2e-spec.ts` |

## 3. Reglas transversales

| ID | Regla | Estado | Dónde vive | Prueba |
|---|---|---|---|---|
| **RN-014** | La **validación es en dos niveles**: el DTO cuida la forma del pedido HTTP y el value object cuida la regla de negocio | Vigente | `app.setup.ts:11-12` · los VO en `domain/value-objects/` | specs de cada VO · `flujo-completo.e2e-spec.ts` |
| **RN-015** | **Un error de negocio nunca responde 500**: un único filtro traduce `kind` → HTTP | Vigente | `domain-exception.filter.ts:14` | `flujo-completo.e2e-spec.ts` · `errores-de-dominio.spec.ts` |
| **RN-016** | **El evento se publica DESPUÉS de persistir** (nunca antes) | Vigente | `publicar-vacante.handler.ts:45,49` · `postular.handler.ts:59,62` | `postular.handler.spec.ts` · `publicar-vacante.handler.spec.ts` |
| **RN-017** | **Un contexto no importa el dominio del otro**: se comunica por un puerto propio o por un evento | Vigente | `consulta-de-vacantes.port.ts` · `vacante-postulacion.listener.ts` | `vacante-postulacion.listener.spec.ts` |
| **RN-018** | Todo **identificador es un UUID válido** (`ID_INVALIDO`) | Vigente | `vacante-id.vo.ts:15` · `postulacion-id.vo.ts` | `errores-de-dominio.spec.ts` |

---

## 4. Catálogo de errores

El `code` es un **contrato estable con el cliente**: no se cambia a la ligera.
El dominio solo declara el `kind`; el filtro lo traduce a HTTP.

Archivo fuente: `src/comun/domain/errors/error-codes.ts` (catálogo único).
Toda la tabla está cubierta por `src/comun/domain/errors/errores-de-dominio.spec.ts`,
que además **falla si se agrega un código sin su prueba**.

| `code` | `kind` | HTTP | Cuándo |
|---|---|---|---|
| `ID_INVALIDO` | VALIDATION | 400 | Un identificador no es un UUID válido |
| `TITULO_INVALIDO` | VALIDATION | 400 | El título no tiene entre 5 y 120 caracteres |
| `DESCRIPCION_MUY_CORTA` | VALIDATION | 400 | La descripción tiene menos de 20 caracteres |
| `PERFIL_CARGO_INVALIDO` | VALIDATION | 400 | El perfil no es `PROFESIONAL` ni `OPERARIO` |
| `NOMBRE_INVALIDO` | VALIDATION | 400 | El nombre no tiene entre 3 y 120 caracteres |
| `DNI_INVALIDO` | VALIDATION | 400 | El DNI no son 8 dígitos |
| `CORREO_INVALIDO` | VALIDATION | 400 | El correo no tiene formato válido |
| `ESTADO_INVALIDO` | VALIDATION | 400 | El estado no existe |
| `SALDO_INVALIDO` | VALIDATION | 400 | El saldo no es un entero ≥ 0 |
| `VACANTE_NO_ENCONTRADA` | NOT_FOUND | 404 | No existe la vacante indicada |
| `VACANTE_YA_PUBLICADA` | CONFLICT | 409 | Se intentó publicar una vacante ya publicada |
| `VACANTE_YA_CERRADA` | CONFLICT | 409 | Se operó sobre una vacante ya cerrada |
| `VACANTE_NO_PUBLICADA` | CONFLICT | 409 | Se intentó cerrar una vacante en BORRADOR |
| `CREDITOS_INSUFICIENTES` | CONFLICT | 409 | No hay saldo para publicar |
| `POSTULANTE_YA_POSTULO` | CONFLICT | 409 | El mismo DNI ya se postuló a esa vacante |

**Forma de la respuesta:** `{ "statusCode": <http>, "code": "<CODE>", "message": "<texto>" }`.

---

## 5. Reglas que garantiza la BASE

Estas no dependen de que el código esté bien: las hace cumplir PostgreSQL, así
que tampoco las rompe una carrera entre dos pedidos simultáneos.

| Regla | Cómo | Dónde |
|---|---|---|
| Dedup por DNI | `UNIQUE (vacante_id, documento_identidad)` | `migrations/1750000000001:22` |
| La postulación apunta a una vacante real | `FOREIGN KEY` | `migrations/1750000000001:21` |
| Saldo nunca negativo | `CHECK (disponible >= 0)` | `migrations/1750000000000:34` |
| Estados y perfiles válidos | `CHECK ... IN (...)` | `migrations/1750000000000:23-25` · `...001:23` |
| Postulaciones recibidas ≥ 0 | `CHECK` | `migrations/1750000000000:25` |
