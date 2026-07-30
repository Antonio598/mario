# Plantillas de servicio de EasyPanel

Los ficheros de esta carpeta describen la configuración de cada servicio. EasyPanel se
configura desde su interfaz web, así que sirven como documentación reproducible: si hay que
recrear el VPS, esto es lo que había.

La guía completa, con el orden de los pasos y las comprobaciones posteriores, está en
[../../docs/deployment-easypanel.md](../../docs/deployment-easypanel.md).

| Fichero | Servicio |
|---|---|
| `web.service.json` | Web de producción (rama `main`) |
| `web-staging.service.json` | Staging (rama `develop`, con `noindex`) |
| `n8n.compose.yml` | n8n + su Postgres aislado |
| `uptime-kuma.compose.yml` | Monitorización |

> Los valores marcados como `<...>` son marcadores de posición. **Ningún secreto real debe
> escribirse en estos ficheros**: van al panel, en la sección Environment de cada servicio.
