import type { ReactNode } from 'react';
import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { comprasDisponibles } from '../features/premium/compras';
import { colors, fontSize, radius, spacing, theme } from '../theme';

/**
 * Piezas de interfaz compartidas por todas las pantallas de la app nativa.
 *
 * Equivalen a las clases .ra-* de la web: un solo boton, una sola tarjeta,
 * una sola cabecera de pantalla. La app se abre a diario; lo que la hace
 * sentir una sola cosa es que todas las pantallas usen las mismas piezas.
 */

/* -------------------------------------------------------------------------- */
/* Texto                                                                       */
/* -------------------------------------------------------------------------- */

export function Kicker({ children, centrado = false }: { children: ReactNode; centrado?: boolean }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        justifyContent: centrado ? 'center' : 'flex-start',
      }}
    >
      <View style={{ width: 18, height: 2, borderRadius: 2, backgroundColor: colors.rojo }} />
      <Text style={theme.kicker}>{children}</Text>
    </View>
  );
}

export function Titulo({ children, tamano }: { children: ReactNode; tamano?: number }) {
  return (
    <Text style={[theme.titulo, tamano !== undefined && { fontSize: tamano }]}>{children}</Text>
  );
}

/** Cabecera de pantalla: kicker + titulo + entradilla. Todas abren igual. */
export function Cabecera({
  kicker,
  titulo,
  entradilla,
}: {
  kicker: string;
  titulo: string;
  entradilla?: string;
}) {
  return (
    <View>
      <Kicker>{kicker}</Kicker>
      <Text style={[theme.titulo, { marginTop: spacing.sm }]}>{titulo}</Text>
      {entradilla !== undefined && (
        <Text style={[theme.textoTenue, { marginTop: spacing.xs }]}>{entradilla}</Text>
      )}
    </View>
  );
}

export function TituloSeccion({ children, derecha }: { children: ReactNode; derecha?: ReactNode }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: spacing.md,
      }}
    >
      <Text
        style={{
          color: colors.blanco,
          fontSize: fontSize.base,
          fontWeight: '700',
          letterSpacing: 1.5,
          textTransform: 'uppercase',
        }}
      >
        {children}
      </Text>
      {derecha}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Superficies                                                                 */
/* -------------------------------------------------------------------------- */

export function Tarjeta({
  children,
  destacada = false,
  style,
}: {
  children: ReactNode;
  /** Borde rojo: tareas pendientes y llamadas a la accion. */
  destacada?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        theme.tarjeta,
        { borderRadius: radius.lg },
        destacada && { borderColor: 'rgba(211, 47, 47, 0.45)' },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Chip({ children, rojo = false }: { children: ReactNode; rojo?: boolean }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        borderWidth: 1,
        borderColor: colors.negroBorde,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 3,
      }}
    >
      <Text
        style={{ color: rojo ? colors.rojo : colors.grisTenue, fontSize: 11, fontWeight: '600' }}
      >
        {children}
      </Text>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Botones                                                                     */
/* -------------------------------------------------------------------------- */

type Variante = 'primario' | 'secundario' | 'fantasma' | 'invertido';

export function Boton({
  texto,
  onPress,
  variante = 'primario',
  deshabilitado = false,
  icono,
  style,
}: {
  texto: string;
  onPress: () => void;
  variante?: Variante;
  deshabilitado?: boolean;
  icono?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
}) {
  const base =
    variante === 'primario'
      ? theme.botonPrimario
      : variante === 'invertido'
        ? [theme.botonPrimario, { backgroundColor: colors.blancoPuro }]
        : variante === 'secundario'
          ? theme.botonSecundario
          : [theme.botonSecundario, { borderWidth: 0, minHeight: 44 }];

  const color =
    variante === 'primario'
      ? colors.blancoPuro
      : variante === 'invertido'
        ? colors.rojo
        : variante === 'secundario'
          ? colors.grisTexto
          : colors.grisTenue;

  return (
    <Pressable
      onPress={onPress}
      disabled={deshabilitado}
      accessibilityRole="button"
      style={({ pressed }) => [
        base,
        { borderRadius: radius.md, flexDirection: 'row', gap: spacing.sm },
        pressed && { transform: [{ scale: 0.98 }] },
        deshabilitado && { opacity: 0.55 },
        style,
      ]}
    >
      {icono !== undefined && <Ionicons name={icono} size={16} color={color} />}
      <Text
        style={[
          theme.textoBoton,
          { color },
          variante === 'fantasma' && { textTransform: 'none', letterSpacing: 0, fontWeight: '600' },
        ]}
      >
        {texto}
      </Text>
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/* Opciones tipo radio                                                         */
/* -------------------------------------------------------------------------- */

export function Opcion({
  texto,
  activa,
  onPress,
  multiple = false,
}: {
  texto: string;
  activa: boolean;
  onPress: () => void;
  multiple?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={multiple ? 'checkbox' : 'radio'}
      accessibilityState={multiple ? { checked: activa } : { selected: activa }}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          minHeight: 52,
          paddingHorizontal: spacing.md,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: activa ? colors.rojo : colors.negroBorde,
          backgroundColor: activa ? colors.rojoTenue : 'transparent',
        },
        pressed && { opacity: 0.85 },
      ]}
    >
      <View
        style={{
          width: 16,
          height: 16,
          borderRadius: multiple ? 4 : 8,
          borderWidth: 2,
          borderColor: activa ? colors.rojo : colors.negroBorde,
          backgroundColor: activa ? colors.rojo : 'transparent',
        }}
      />
      <Text
        style={{
          flex: 1,
          color: activa ? colors.blanco : colors.grisTexto,
          fontSize: fontSize.base,
          fontWeight: activa ? '600' : '400',
        }}
      >
        {texto}
      </Text>
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/* Acceso Premium — REGLA DE PLATAFORMA                                        */
/* -------------------------------------------------------------------------- */

/**
 * Premium se vende dentro de la app con el sistema de compra de la tienda
 * (App Store / Google Play, via RevenueCat): es lo unico que Apple (3.1.1)
 * acepta para contenido digital. El precio que se ensena es el que devuelve
 * la tienda, nunca uno escrito aqui, y NUNCA hay enlace a un pago externo.
 *
 * Si la plataforma no tiene clave de RevenueCat (compras no configuradas), se
 * vuelve al patron Netflix/Kindle: decir que la funcion pertenece a un plan y
 * que el acceso se gestiona fuera, sin decir donde ni cuanto. Ese es el unico
 * texto valido para ello; si alguien anade un enlace o un precio junto a el,
 * la app deja de ser publicable.
 */
export const TEXTO_ACCESO_NATIVO =
  'Incluido en Reset Alfa Premium. El acceso se gestiona desde tu cuenta en la web.';

const TEXTO_ACCESO_TIENDA = 'Incluido en Reset Alfa Premium.';

/** Texto corto para el pie de un bloqueo, segun haya o no compra en la app. */
export function textoAcceso(): string {
  return comprasDisponibles() ? TEXTO_ACCESO_TIENDA : TEXTO_ACCESO_NATIVO;
}

/** Ruta del paywall nativo. */
export const RUTA_PREMIUM = '/(modals)/premium' as const;

export function Candado({ tamano = 16 }: { tamano?: number }) {
  return (
    <View
      style={{
        width: tamano * 2.25,
        height: tamano * 2.25,
        borderRadius: 999,
        backgroundColor: colors.rojo,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name="lock-closed" size={tamano} color={colors.blancoPuro} />
    </View>
  );
}

/**
 * Enlace en linea al paywall. No pinta nada si la compra en la app no esta
 * disponible: entonces el texto de al lado ya dice donde se gestiona.
 */
export function EnlacePremium({ texto = 'Ver Premium →' }: { texto?: string }) {
  const router = useRouter();
  if (!comprasDisponibles()) return null;
  return (
    <Pressable onPress={() => router.push(RUTA_PREMIUM)} accessibilityRole="link" hitSlop={8}>
      <Text style={{ color: colors.rojo, fontWeight: '700', fontSize: fontSize.sm, marginTop: spacing.sm }}>
        {texto}
      </Text>
    </Pressable>
  );
}

/**
 * Zona Premium para un usuario gratuito.
 *
 * Igual que en la web: se ve lo que hay detras, atenuado, con el candado
 * encima. Los hijos son una vista previa estatica -nunca datos del usuario-
 * y no reciben toques. Con compra disponible, tocar el bloque abre el paywall.
 */
export function Bloqueado({
  titulo,
  texto,
  children,
}: {
  titulo: string;
  texto: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const comprable = comprasDisponibles();
  return (
    <Pressable
      onPress={comprable ? () => router.push(RUTA_PREMIUM) : undefined}
      disabled={!comprable}
      accessibilityRole={comprable ? 'button' : undefined}
      accessibilityLabel={`${titulo}. Premium.`}
      style={({ pressed }) => [
        {
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: 'rgba(211, 47, 47, 0.45)',
          overflow: 'hidden',
        },
        pressed && { opacity: 0.85 },
      ]}
    >
      <View pointerEvents="none" style={{ opacity: 0.28 }} accessibilityElementsHidden>
        {children}
      </View>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: spacing.lg,
        }}
      >
        <Candado tamano={18} />
        <Text style={[theme.kicker, { marginTop: spacing.md }]}>Premium</Text>
        <Text
          style={[
            theme.titulo,
            { fontSize: fontSize.lg, marginTop: spacing.xs, textAlign: 'center' },
          ]}
        >
          {titulo}
        </Text>
        <Text style={[theme.textoTenue, { marginTop: spacing.xs, textAlign: 'center' }]}>
          {texto}
        </Text>
        <Text
          style={[
            comprable ? { color: colors.rojo, fontWeight: '700' } : theme.textoTenue,
            { marginTop: spacing.md, textAlign: 'center', fontSize: fontSize.xs },
          ]}
        >
          {comprable ? 'Toca para ver Premium' : TEXTO_ACCESO_NATIVO}
        </Text>
      </View>
    </Pressable>
  );
}

/**
 * Tarjeta de acceso. Con compra disponible es un boton que abre el paywall;
 * sin ella, informativa: sin enlace y sin precio (ver arriba).
 */
export function AvisoAcceso({ texto }: { texto: string }) {
  const router = useRouter();
  const comprable = comprasDisponibles();
  const contenido = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
      <Candado tamano={14} />
      <View style={{ flex: 1 }}>
        <Text style={theme.kicker}>Premium</Text>
        <Text style={[theme.texto, { color: colors.blanco, marginTop: 2 }]}>{texto}</Text>
        <Text
          style={[
            comprable ? { color: colors.rojo, fontWeight: '700' } : theme.textoTenue,
            { marginTop: 4, fontSize: fontSize.xs },
          ]}
        >
          {comprable ? 'Ver Premium →' : TEXTO_ACCESO_NATIVO}
        </Text>
      </View>
      {comprable && <Ionicons name="chevron-forward" size={18} color={colors.grisTenue} />}
    </View>
  );
  if (!comprable) return <Tarjeta destacada>{contenido}</Tarjeta>;
  return (
    <Pressable
      onPress={() => router.push(RUTA_PREMIUM)}
      accessibilityRole="button"
      style={({ pressed }) => [pressed && { opacity: 0.85 }]}
    >
      <Tarjeta destacada>{contenido}</Tarjeta>
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/* Estados                                                                     */
/* -------------------------------------------------------------------------- */

/** Mensaje de error bajo un formulario. No se llama `Error` para no tapar al global. */
export function MensajeError({ mensaje }: { mensaje: string | null }) {
  if (mensaje === null) return null;
  return (
    <Text style={{ color: colors.rojoClaro, fontSize: fontSize.sm, marginTop: spacing.md }}>
      {mensaje}
    </Text>
  );
}
