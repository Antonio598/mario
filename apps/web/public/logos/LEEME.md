# Logos

Los dos logos ya estan puestos. La app los lee de aqui.

| Fichero | Tamano | Donde aparece |
|---|---|---|
| `app.png` | 1080x1080 | Icono de la PWA, pantalla de acceso, cabecera de Inicio |
| `programa.png` | 1080x607 | Tarjeta de acceso a Reset Alfa en Formacion |

## Para sustituirlos

Deja los nuevos con el MISMO nombre y sobrescribe. Si cambian las proporciones,
actualiza la constante `PROPORCION` de
`apps/web/src/components/app/Logo.tsx`: pasar unas proporciones que no
coinciden con la imagen la deforma y descuadra el hueco reservado.

**Nombres sin espacios ni acentos.** En una URL obligan a codificarlos y es una
fuente de fallos silenciosos.

**Fondo transparente.** La app tiene modo oscuro por defecto: un logo con fondo
blanco se veria como un recuadro blanco.
