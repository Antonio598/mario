# Logos

Sube aquí los dos logos y la app los usará automáticamente.

| Fichero | Dónde aparece | Formato |
|---|---|---|
| `app.svg` (o `app.png`) | Icono de la app, pantalla de acceso, cabecera | Cuadrado. SVG preferible; si es PNG, 512×512 |
| `programa.svg` (o `programa.png`) | Logotipo del nombre "Reset Alfa" en Formación y en la ficha del programa | Horizontal, fondo transparente |

**Fondo transparente.** La app tiene modo claro y oscuro: un logo con fondo blanco
se verá como un recuadro blanco sobre negro.

Si subes PNG en vez de SVG, cambia la extensión en
`apps/web/src/components/app/Logo.tsx`.

Mientras no existan, se muestra el texto "RESET ALFA" con la tipografía de marca.
