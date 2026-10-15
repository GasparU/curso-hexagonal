# Reglas de negocio

> Catálogo de reglas y errores de la API. Es el contrato con el cliente: los `code`
> son **estables** y no se cambian a la ligera.
> **Actualizado:** 2026-10-15 11:02 (Lima) · Dueño: José Gaspar

---

## 1. Contexto VACANTES

| # | Regla | Dónde vive |
|---|---|---|
| V1 | Una vacante **nace en BORRADOR** | `Vacante.crear()` |
| V2 | **No se puede volver a BORRADOR** (no hay transición hacia atrás) | `EstadoVacante` (no expone esa transición) |
| V3 | **Publicar consume un crédito.** Sin saldo → `CREDITOS_INSUFICIENTES` | `Vacante.publicar(saldo)` |
| V4 | **No se publica dos veces** → `VACANTE_YA_PUBLICADA` | `Vacante.publicar()` |
| V5 | **No se cierra en BORRADOR** → `VACANTE_NO_PUBLICADA` | `Vacante.cerrar()` |
| V6 | Cerrar **no borra**: solo cambia el estado, y no se vuelve atrás → `VACANTE_YA_CERRADA` | `Vacante.cerrar()` |
| V7 | El **contador de postulaciones** lo sube el listener cuando llega el evento del otro contexto | `Vacante.registrarPostulacion()` |

## 2. Contexto POSTULACIONES

| # | Regla | Dónde vive |
|---|---|---|
| P1 | Una postulación **nace en RECIBIDA** | `Postulacion.registrar()` |
| P2 | **Mismo DNI + misma vacante = no se duplica** → `POSTULANTE_YA_POSTULO` | `PostularHandler` (código) + `UNIQUE` en la base |
| P3 | **No se puede postular a una vacante que no existe** → `VACANTE_NO_ENCONTRADA` | `PostularHandler` (vía puerto `ConsultaDeVacantes`) |
| P4 | El **DNI son 8 dígitos**, sin letras | `DocumentoIdentidad` |

## 3. Reglas transversales

| # | Regla | Dónde vive |
|---|---|---|
| T1 | **Validación en dos niveles**: el DTO valida el borde y el value object vuelve a validar | `dto/` + `value-objects/` |
| T2 | **Un error de negocio NUNCA responde 500** | `FiltroExcepcionesDominio` |
| T3 | El **evento se publica DESPUÉS de persistir** | `PublicarVacanteHandler`, `PostularHandler` |
| T4 | Los contextos **no se importan el dominio entre sí** | puerto `ConsultaDeVacantes` + evento |

---

## 4. Catálogo de errores

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

**Forma de la respuesta de error:** `{ "statusCode": <http>, "code": "<CODE>", "message": "<texto>" }`.

---

## 5. Reglas que solo la BASE garantiza

Estas no dependen de que el código esté bien: las hace cumplir PostgreSQL.

| Regla | Cómo |
|---|---|
| Dedup por DNI | `UNIQUE (vacante_id, documento_identidad)` en `postulaciones` |
| La postulación referencia una vacante real | `FK postulaciones.vacante_id → vacantes.id` |
| Saldo nunca negativo | `CHECK (disponible >= 0)` en `saldos_creditos` |
| Estados y perfiles válidos | `CHECK` sobre `estado` y `perfil_cargo` |
