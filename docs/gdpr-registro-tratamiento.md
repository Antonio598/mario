# Registro de actividades de tratamiento (art. 30 RGPD)

> **Borrador técnico.** Describe con exactitud lo que el sistema hace, para que quien
> redacte la documentación legal definitiva parta de la realidad y no de una plantilla.
> Debe revisarlo un profesional: hay datos de categoría especial de por medio.

**Responsable del tratamiento:** *(pendiente: nombre/razón social, NIF, domicilio, contacto)*
**Fecha de la versión:** 2026-07-30

---

## 1. Por qué esto importa aquí más que en un proyecto normal

Los registros del protocolo posterior a una recaída describen aspectos de la vida sexual
del usuario. El art. 9.1 RGPD los clasifica como **categoría especial**: su tratamiento
está prohibido salvo que concurra una de las excepciones del art. 9.2. La única aplicable
en este caso es el **consentimiento explícito** (art. 9.2.a).

Las consecuencias prácticas:

- El consentimiento debe ser **separado** del resto y **específico** para esta finalidad.
- No puede ser condición para usar el servicio (art. 7.4): la app tiene que funcionar sin él.
- Debe poder **demostrarse** (art. 7.1) y ser tan fácil de retirar como de otorgar (art. 7.3).
- Las sanciones del art. 83.5 alcanzan los 20 M€ o el 4 % de la facturación global.

---

## 2. Categorías de datos y bases legales

| Categoría | Datos | Base legal | Dónde |
|---|---|---|---|
| Identificativos | Correo, nombre, avatar | Art. 6.1.b — ejecución del contrato | `auth.users`, `profiles` |
| Uso | Check-ins diarios, rachas, progreso | Art. 6.1.b | `checkins`, `streaks`, `progress` |
| **Categoría especial** | Registros de recaída: lugar, hora, disparador, contexto emocional | **Art. 9.2.a — consentimiento explícito** | `relapses` |
| Comerciales | Permisos adquiridos, identificadores de Stripe | Art. 6.1.b | `entitlements` |
| Consentimientos | Decisión, fecha, versión de la política, hash de IP | Art. 6.1.c — obligación legal de acreditación | `consents` |

---

## 3. Medidas técnicas aplicadas

### Consentimiento impuesto por el motor de base de datos

Esta es la medida central y no depende de la interfaz. Un trigger sobre `relapses`
(`app.require_sensitive_consent`) bloquea la inserción si no existe consentimiento vigente:

```sql
create trigger relapses_require_consent
  before insert on public.relapses
  for each row execute function app.require_sensitive_consent();
```

Que el control viva en Postgres y no en la app significa que ningún fallo de interfaz,
ninguna versión antigua del cliente y ninguna llamada directa a la API puede saltárselo.
Verificado por la prueba 5 de `supabase/tests/rls.test.sql`.

### Aislamiento entre usuarios

Row Level Security en todas las tablas. Un usuario autenticado solo alcanza sus propias
filas; el usuario anónimo no tiene ninguna política sobre las tablas personales. Verificado
por las pruebas 1, 2, 7 y 11.

### Prueba del consentimiento

`consents` es un libro de solo inserción: no admite `UPDATE` ni `DELETE`. Retirar el
consentimiento inserta una fila nueva con `concedido = false`. Se conserva la versión del
texto legal aceptado, de modo que puede acreditarse **qué** aceptó exactamente cada usuario
y cuándo. Las IP se guardan hasheadas con sal de servidor, nunca en claro.

### Minimización

Todos los campos del formulario de recaída son opcionales: el usuario puede saltarse
cualquier pregunta y guardar igualmente. No se recogen datos de localización, ni contactos,
ni identificadores de publicidad.

### Cifrado en reposo — y por qué no cifrado de columna

Se aplica el cifrado de disco AES-256 de la plataforma, más RLS estricta y minimización.

**No se usa cifrado a nivel de columna**, por dos razones concretas:

1. `pgsodium` y Transparent Column Encryption están **deprecados** en Supabase. Construir
   sobre una función deprecada es adquirir deuda con fecha de caducidad conocida.
2. La alternativa —cifrar en el cliente— haría imposible el análisis de patrones de
   disparadores previsto en la Fase 5, que es una de las funciones de valor del producto.

Es una decisión consciente con una contrapartida asumida, no un descuido. Si el análisis
de riesgos posterior la considera insuficiente, la vía es cifrado en cliente renunciando al
análisis en servidor.

### Derechos del interesado

| Derecho | Implementación | Verificado por |
|---|---|---|
| Acceso (art. 15) | `public.export_my_data()` | Prueba 12 |
| Portabilidad (art. 20) | Misma función, salida JSON | Prueba 12 |
| Supresión (art. 17) | `public.delete_my_account()` — borrado real por cascada | Pruebas 13 y 14 |
| Rectificación (art. 16) | Políticas de `UPDATE` sobre `relapses` | — |
| Retirada del consentimiento (art. 7.3) | Nueva fila en `consents` desde Ajustes | — |

La supresión es real: elimina la fila de `auth.users` y todo cae por `ON DELETE CASCADE`.
No queda una copia "desactivada". En `deletion_log` solo permanecen el UUID y la fecha, sin
ningún dato asociado, como prueba de que la supresión se ejecutó.

---

## 4. Encargados del tratamiento

| Encargado | Finalidad | Ubicación |
|---|---|---|
| Supabase | Base de datos y autenticación | **UE — Frankfurt** |
| *(proveedor del VPS)* | Alojamiento de web y n8n | **UE** |
| Stripe (Fase 4) | Pagos | UE/EE. UU. — DPF |
| Anthropic (Fase 3) | Generación de borradores | EE. UU. — **sin datos personales** |
| Google AdSense (Fase 3) | Publicidad | EE. UU. — DPF |
| Expo / EAS | Notificaciones push | EE. UU. |

Al pipeline de contenido no llega **ningún** dato personal: opera sobre el banco de temas,
nunca sobre datos de usuario.

Pendiente: firmar el contrato de encargado (art. 28) con cada proveedor.

---

## 5. Conservación

| Dato | Plazo |
|---|---|
| Cuenta y perfil | Mientras la cuenta esté activa |
| Registros de recaída | Mientras la cuenta esté activa o hasta que se retire el consentimiento |
| Consentimientos | Cuenta activa + plazo de prescripción, como prueba |
| `deletion_log` | Indefinido (solo UUID y fecha) |

**Pendiente de decidir:** una política de retirada del consentimiento de datos sensibles
que además **borre** los registros ya existentes, no solo impida crear nuevos. Retirar el
consentimiento no obliga automáticamente a suprimir lo tratado lícitamente antes, pero es
lo que el usuario razonablemente espera. Recomendación: borrarlos, y decirlo en la
política.

---

## 6. Pendiente antes de publicar

- [ ] Identidad completa del responsable (razón social, NIF, domicilio, correo)
- [ ] Revisión legal de la política de privacidad
- [ ] Contratos de encargado del tratamiento (art. 28) firmados
- [ ] Valorar si procede una Evaluación de Impacto (art. 35): hay tratamiento a gran escala
      de datos del art. 9, lo que apunta a que sí
- [ ] Decisión sobre el borrado de registros al retirar el consentimiento
- [ ] Procedimiento de notificación de brechas en 72 h (art. 33)
