# SQL de Reset Alfa

## Orden de ejecución

Pega cada fichero en el SQL Editor de Supabase, **en este orden**:

| # | Fichero | Qué hace |
|---|---|---|
| 1 | `instalacion-esquema-aislado.sql` | Crea las 18 tablas bajo `reset_alfa`, sin tocar `public` |
| 2 | `contenido-real.sql` | Masterclasses, protocolos, libros, programa y artículos |
| 3 | `admin-editores.sql` | *(opcional)* Panel de administración. **Cambia el correo del final por el tuyo** |
| 4 | `arreglo-consentimiento.sql` | RPC `dar_consentimiento`. Sin él, «Acepto, empezar el protocolo» puede fallar |
| 5 | `pad.sql` | Columna `profiles.pad` y RPC `guardar_pad`. Sin él, el P.A.D no se puede crear |
| 6 | `carta.sql` | Columna `profiles.carta` y RPC `guardar_carta`. Sin él, la carta anti-recaída no se puede crear |
| 7 | `plan.sql` | Columna `profiles.plan` y RPC `guardar_plan`. Sin él, el test de entrada no se puede guardar y la app manda al test en bucle |
| 8 | `premium-1-tipo.sql` | **Pégalo SOLO, en su propia ejecución.** Añade el tipo `suscripcion` al enum. PostgreSQL no deja usar un valor de enum en la misma transacción en que se crea |
| 9 | `premium-2-suscripcion.sql` | Columnas de suscripción en `entitlements`, producto `premium-mensual` y RPC `es_premium` |

Los nueve son idempotentes: puedes reejecutarlos sin duplicar nada.

**El SQL Editor envuelve cada ejecución en una transacción.** Si un fichero da
un error en cualquier punto, deshace todo lo anterior y no queda nada. Por eso
un fallo en la línea 900 deja la base exactamente como estaba.

## Comprobar el estado

```sql
select
  to_regnamespace('reset_alfa') is not null            as existe_esquema,
  (select count(*) from information_schema.tables
     where table_schema = 'reset_alfa')                as tablas,
  (select count(*) from information_schema.tables
     where table_schema = 'public')                    as tablas_de_tu_crm,
  current_database()                                    as base_de_datos;
```

Esperado: `true`, **18**, y el número de tu CRM sin cambios.

## Deshacer

Elimina Reset Alfa sin tocar nada más:

```sql
drop schema if exists reset_alfa cascade;
drop schema if exists reset_alfa_priv cascade;
```

## Después del SQL, dos pasos en el servidor

**1. Exponer el esquema.** En Supabase self-hosted no hay panel para esto: va en
el `docker-compose.yml`, servicio `rest`.

```yaml
PGRST_DB_SCHEMAS: "public,storage,graphql_public,reset_alfa"
```

Añade `reset_alfa` a la lista existente **sin sustituirla** —quitar `storage`
rompe los ficheros— y reinicia con `docker compose up -d rest`.

**2. En EasyPanel**, Build Arguments:

```
NEXT_PUBLIC_SUPABASE_SCHEMA=reset_alfa
```

---

## Migraciones

`migrations/` contiene la instalación para un proyecto Supabase **dedicado**,
donde todo vive en `public`. Se aplican con la CLI (`supabase db push`) y son
alternativas a `instalacion-esquema-aislado.sql`, no complementarias.

`tests/` son las pruebas de aislamiento RLS. Es la verificación más importante
del repositorio: detrás de esas políticas hay datos de categoría especial del
art. 9 RGPD.
