# Decisiones de arquitectura (ADR)

> Por qué el proyecto está armado así y no de otra forma. Cada decisión dice el
> **porqué**, la **alternativa que se descartó** y lo que **cuesta**.
> **Actualizado:** 2026-10-15 (Lima) · Dueño: José Gaspar

El catálogo de reglas de negocio vive aparte, en [`reglas-negocio.md`](reglas-negocio.md).

---

## ADR-001 — Dos contextos acotados: Vacantes y Postulaciones

**Decisión:** el sistema se parte en dos contextos, cada uno con sus tres capas
(`domain/`, `application/`, `infrastructure/`), su propio modelo y sus propios
value objects. **No comparten ni una entidad.**

**Por qué:** una vacante y una postulación cambian por motivos distintos y las
trabajan personas distintas. Si compartieran el modelo, un cambio en el workflow
de las postulaciones obligaría a tocar el de vacantes.

**Alternativa descartada:** un único contexto con `Vacante` y `Postulacion` juntas.
Es más rápido de escribir, pero deja un modelo acoplado que no se puede separar.

**Costo:** hay que resolver el cruce entre ambos contextos (ver ADR-006) y el
código tiene más carpetas. Se paga con dos archivos extra.

---

## ADR-002 — Núcleo compartido en `src/comun/`

**Decisión:** los errores de negocio, el evento de dominio base, el reloj, el
generador de identificadores y el publicador de eventos viven en `src/comun/`.

**Por qué:** hay cosas que son **contrato del sistema entero**, no de un contexto:

- Los errores: si cada contexto tuviera su propia clase de excepción, el filtro
  HTTP tendría que conocerlas todas y **una se le escaparía como 500**.
- El reloj y el generador de ids: son dependencias externas que deben poder
  reemplazarse en los tests para que sean deterministas.

**Alternativa descartada:** duplicar cada pieza en cada contexto. Genera dos
catálogos de errores que se desincronizan.

**Costo:** es una carpeta más de la que hay que cuidar. La regla es que `comun/`
solo puede tener piezas **sin lógica de negocio**.

---

## ADR-003 — Los puertos se inyectan por token `Symbol`

**Decisión:** cada puerto se declara como `interface` + una constante `Symbol`
(ej. `VACANTE_REPOSITORIO`), y los casos de uso lo piden por ese token.

**Por qué:** en TypeScript las interfaces **no existen cuando el programa corre**,
así que Nest no puede resolverlas como dependencia. El `Symbol` es un
identificador real en ejecución y hace que el caso de uso dependa del
**contrato**, nunca de la clase concreta.

**Alternativa descartada:** inyectar la clase concreta del repositorio. Funciona,
pero el caso de uso queda casado con TypeORM.

**Costo:** una línea extra por puerto (el `Symbol`) y un proveedor explícito en
el módulo.

---

## ADR-004 — Dos adaptadores por repositorio: TypeORM y en memoria

**Decisión:** cada puerto de repositorio tiene una implementación real (TypeORM) y
una en memoria.

**Por qué:** el adaptador en memoria es lo que permite probar los casos de uso
**sin Nest, sin base de datos y sin esperar**: `pnpm test` corre en segundos. Y
demuestra que el puerto está bien definido: si se puede cambiar el adaptador sin
tocar el caso de uso, la frontera es real.

**Alternativa descartada:** probar todo contra Postgres. Más lento, más frágil y
no probaría que el puerto esté bien aislado.

**Costo:** hay que mantener el adaptador en memoria cuando cambia el puerto.

---

## ADR-005 — La entidad registra sus eventos; el caso de uso los publica

**Decisión:** `Vacante.publicar()` y `Postulacion.registrar()` **registran** el
evento dentro de la entidad. El caso de uso los publica con `tomarEventos()`
**después** de persistir.

**Por qué:** el hecho de negocio ("se publicó una vacante") lo conoce la entidad,
que es quien cambió de estado. Si el caso de uso fabricara el evento, la entidad
podría cambiar sin que nadie se entere. Y publicar **antes** de guardar es un
error real: el oyente podría leer datos que todavía no están en la base.

**Alternativa descartada:** que el caso de uso construya el evento (era el
diseño anterior) o que publique antes de guardar. La segunda es la que la rúbrica
marca explícitamente como defecto.

**Costo:** las entidades tienen un `_eventos` interno y un método `tomarEventos()`.
`tomarEventos` **limpia** la lista para que el evento no se publique dos veces.

---

## ADR-006 — El cruce entre contextos: puerto propio + evento

**Decisión:** Postulaciones pregunta por una vacante con **su propio** puerto
(`ConsultaDeVacantes`), implementado por un adaptador. Y Vacantes se entera de una
postulación escuchando el evento `PostulacionEnviada`, con un oyente en
`vacantes/infrastructure/listeners/`.

**Por qué:** el proyecto tiene **una sola base de datos**, así que la tentación es
que Postulaciones importe la entidad `Vacante` y consulte la tabla. Eso amarra los
dos contextos: ya no podrían separarse ni cambiar de base por separado. Con el
puerto, Postulaciones declara **qué necesita** y el adaptador decide cómo lo
consigue. Con el evento, Vacantes reacciona **sin que Postulaciones sepa que
existe**.

**Alternativa descartada:** importar el dominio de Vacantes desde Postulaciones.
Es lo más corto y es exactamente lo que rompe la separación.

**Costo:** el adaptador es una capa más de indirección y el evento es
**asincrónico**: el contador de la vacante se actualiza después, no en la misma
transacción.

---

## ADR-007 — Servicio de dominio para las reglas que no son de una sola entidad

**Decisión:** "una persona no se postula dos veces a la misma vacante" y "solo se
postula a vacantes que existen" viven en `RegistroDePostulaciones`
(`postulaciones/domain/services/`), que depende de **puertos**, no de repositorios.

**Por qué:** esas reglas son de negocio, pero **no pueden ser un método de la
entidad `Postulacion`**: para saber si alguien ya se postuló hay que mirar *todas*
las postulaciones, y una entidad sola no ve las demás. Ese es el caso de uso
clásico del **servicio de dominio**. Si la regla quedara en el handler, el caso de
uso tendría lógica de negocio — justo lo que no debe tener.

**Alternativa descartada:** dejar el `if` en el handler (era el diseño anterior).
Funciona, pero el caso de uso deja de ser "orquestación" y la regla deja de ser
testeable sin armar el caso de uso entero.

**Costo:** una clase más y un proveedor que la arma en el módulo con `useFactory`.

---

## ADR-008 — `toPrimitives()` / `fromPrimitives()`: la frontera del agregado

**Decisión:** hacia afuera, la entidad entrega **primitivos** (`toPrimitives()`) y
se rehidrata desde primitivos (`fromPrimitives()`), que **vuelve a validar**.

**Por qué:** la base de datos, el mapper y la capa HTTP no tienen por qué conocer
`Titulo` o `EstadoVacante`. Y al volver de la base, `fromPrimitives` reconstruye
los value objects, así que **un dato corrupto en la base no entra al dominio**:
falla ruidosamente en vez de propagarse.

**Alternativa descartada:** un constructor gigante con nueve parámetros posicionales
(era el diseño anterior). Un parámetro de más o de menos y el bug es silencioso.

**Costo:** una `interface` de primitivos por entidad.

---

## ADR-009 — Errores con `code` + `kind`, y un único filtro

**Decisión:** el dominio lanza `DomainException` con un `code` **estable** (el
contrato con el cliente, ej. `POSTULANTE_YA_POSTULO`) y un `kind`
(`VALIDATION` / `NOT_FOUND` / `CONFLICT`). **Un solo filtro** traduce `kind` a HTTP.

**Por qué:** el dominio **no debe saber qué es un 409**. Si lanzara
`HttpException`, el día que el dominio se use desde un proceso por lotes —sin
HTTP— habría que reescribirlo. Y con un único filtro, **ningún error de negocio
puede terminar en un 500 genérico**, que es el peor resultado posible para el
cliente.

**Alternativa descartada:** `throw new NotFoundException()` desde el dominio. Es
lo más común y es la falta grave que la rúbrica castiga.

**Costo:** hay que mantener el catálogo (`error-codes.ts`) y el documento de
reglas alineados; un test lo vigila.

---

## ADR-010 — `synchronize: false` y esquema por migraciones

**Decisión:** TypeORM nunca crea ni modifica tablas. El esquema sale de migraciones
versionadas con `up` y `down`, y la app y el CLI de migraciones comparten la misma
configuración de conexión (`data-source.ts`).

**Por qué:** `synchronize: true` compara entidades con la base y **borra columnas**
cuando no las encuentra. En desarrollo parece cómodo; en producción es pérdida de
datos. Con migraciones, cada cambio de esquema es un archivo revisable, con vuelta
atrás.

**Alternativa descartada:** `synchronize: true`. Nunca.

**Costo:** dos pasos para levantar el proyecto (`migration:run` antes de arrancar).
Lo documenta el README.

---

## ADR-011 — Las restricciones que solo la base puede garantizar

**Decisión:** el dedup por DNI es `UNIQUE (vacante_id, documento_identidad)`, la
postulación apunta a una vacante real con `FOREIGN KEY`, y el saldo no puede ser
negativo con `CHECK`.

**Por qué:** son reglas que el código valida, pero **dos pedidos simultáneos**
pueden pasar los dos por el mismo `if` antes de que alguno guarde. La base es el
único lugar donde la restricción se cumple **de verdad, siempre**. El código
valida para dar un error lindo; la base garantiza que no se corrompa.

**Alternativa descartada:** validar solo en el código. Deja la puerta abierta a la
condición de carrera.

**Costo:** un error de base (`P2002`) si algo se escapa; el código debe estar
preparado. Hoy el caso normal no llega ahí.

---

## ADR-012 — Validación en dos niveles

**Decisión:** el DTO con `ValidationPipe` valida en el borde (`whitelist: true`,
`forbidNonWhitelisted: true`) **y** el value object vuelve a validar en el dominio.

**Por qué:** son dos trabajos distintos. El DTO cuida **la forma del pedido HTTP**
(tipos, campos de más, campos que faltan). El value object cuida **la regla de
negocio** y garantiza que **no exista un objeto inválido en memoria**, venga de
donde venga el dato (HTTP, base de datos, un test). Si la regla estuviera solo en
el DTO, un dato que entra por la base la esquivaría.

**Alternativa descartada:** validar solo en el DTO. Es lo habitual y deja al
dominio indefenso.

**Costo:** la regla aparece escrita dos veces. Es a propósito.

---

## ADR-013 — Un solo lugar lee `process.env`

**Decisión:** `src/config/env.validation.ts` es el único archivo que lee variables
de entorno, y **valida al arrancar**: si falta una, la aplicación no levanta.
**Ninguna variable tiene valor por defecto.**

**Por qué:** un valor por defecto (como `localhost`) es un error silencioso: la
app arranca apuntando a una base que no es y el problema se descubre en
producción. Que falle al arrancar es mejor.

**Alternativa descartada:** leer `process.env` desde cada servicio, con `??`
poniendo valores por defecto. Es lo más cómodo y esconde los errores de
configuración.

**Costo:** hay que declarar cada variable nueva en un archivo más.

---

## ADR-014 — CQRS: comandos escriben, consultas leen

**Decisión:** cada caso de uso vive en su carpeta (`commands/crear-vacante/`,
`queries/obtener-vacante/`) con su comando/consulta, su handler y su vista. El
controlador solo hace `CommandBus.execute()` o `QueryBus.execute()`.

**Por qué:** separa dos cosas que se confunden todo el tiempo: **modificar** el
sistema y **leerlo**. El comando pasa por el dominio (valida, aplica reglas,
persiste, publica); la consulta puede leer directo y devolver una **vista** hecha
para la pantalla (sin cargar la entidad entera ni pasar por el dominio). Y el
controlador queda delgado: no sabe de repositorios.

**Alternativa descartada:** un único `VacantesService` con todos los métodos. Es el
esquema por defecto de Nest y mezcla lectura y escritura en el mismo lugar.

**Costo:** más archivos por caso de uso (comando, handler, vista). A cambio, cada
caso de uso se lee solo.

## ADR-015 — Ninguna credencial versionada; la base local no usa contraseña

**Decisión:** `docker-compose.yml` crea el PostgreSQL local con
`POSTGRES_HOST_AUTH_METHOD=trust` (sin contraseña) y publica el puerto **solo en
`127.0.0.1`**. El `.env.example` documenta que `DB_PASSWORD` tiene que existir (la app
la valida al arrancar), pero contra la base local no se usa.

**Por qué:** la contraseña del contenedor de desarrollo **no protege nada** — la caja
vive en la máquina de quien corre el proyecto, se crea al vuelo y adentro solo hay
datos de prueba. Pero estaba escrita en archivos versionados, y eso tiene dos
consecuencias reales: (1) cualquier escáner de secretos la marca, y (2) el repo
afirmaba "sin secretos commiteados" mientras mostraba uno. Un documento que miente es
un bug.

**Alternativa descartada:** `${DB_PASSWORD:?...}` en el compose (que también saca la
clave del repo) **obliga a completar el `.env` ANTES de levantar la base**: quien copia
el `.env.example` y corre `docker compose up` se come un error. Con `trust` la base
levanta sin configurar nada, y `DB_PASSWORD` queda libre para un entorno real.

**Costo:** `trust` significa que **cualquiera que logre alcanzar el puerto** entra sin
contraseña. Por eso el mapeo es `127.0.0.1:5433:5432`: el contenedor no escucha en la
red, solo en la máquina. En producción no se usa este archivo: la clave va en el `.env`
(que **no** se versiona) o en el gestor de secretos del proveedor.
