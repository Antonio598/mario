import { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, TextInput, View } from 'react-native';
import type { Pregunta } from './preguntas';
import { colors, fontSize, spacing, theme } from '../../theme';

interface Props {
  pregunta: Pregunta;
  valor: string | boolean | null;
  onCambio: (valor: string | boolean | null) => void;
}

/**
 * Una pregunta a pantalla completa.
 *
 * La transicion es una entrada suave con desplazamiento vertical corto: marca
 * el avance sin hacer esperar. Se respeta el ajuste del sistema de reducir
 * movimiento a traves de la duracion, que es corta de por si.
 */
export function Paso({ pregunta, valor, onCambio }: Props) {
  const opacidad = useRef(new Animated.Value(0)).current;
  const desplazamiento = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    opacidad.setValue(0);
    desplazamiento.setValue(16);

    Animated.parallel([
      Animated.timing(opacidad, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(desplazamiento, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [pregunta.campo, opacidad, desplazamiento]);

  return (
    <Animated.View
      style={{ opacity: opacidad, transform: [{ translateY: desplazamiento }], flex: 1 }}
    >
      <Text style={[theme.titulo, { fontSize: fontSize.xl }]}>{pregunta.titulo}</Text>

      {pregunta.ayuda !== undefined && (
        <Text style={[theme.textoTenue, { marginTop: spacing.sm }]}>{pregunta.ayuda}</Text>
      )}

      <View style={{ marginTop: spacing.xl }}>
        {pregunta.tipo === 'si_no' ? (
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            {[
              { etiqueta: 'Si', v: true },
              { etiqueta: 'No', v: false },
            ].map(({ etiqueta, v }) => (
              <Pressable
                key={etiqueta}
                onPress={() => onCambio(v)}
                accessibilityRole="radio"
                accessibilityState={{ selected: valor === v }}
                style={[
                  theme.botonSecundario,
                  { flex: 1 },
                  valor === v && { borderColor: colors.rojo, backgroundColor: colors.rojo },
                ]}
              >
                <Text style={theme.textoBoton}>{etiqueta}</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <TextInput
            style={[
              theme.campo,
              pregunta.tipo === 'texto_largo' && { minHeight: 110, textAlignVertical: 'top' },
            ]}
            placeholder={pregunta.placeholder ?? ''}
            placeholderTextColor={colors.grisTenue}
            multiline={pregunta.tipo === 'texto_largo'}
            keyboardType={pregunta.tipo === 'hora' ? 'numbers-and-punctuation' : 'default'}
            value={typeof valor === 'string' ? valor : ''}
            onChangeText={onCambio}
            autoFocus
            accessibilityLabel={pregunta.titulo}
          />
        )}

        {pregunta.tipo === 'hora' && (
          <Text style={[theme.textoTenue, { marginTop: spacing.sm }]}>Formato 24 h, p. ej. 23:40</Text>
        )}
      </View>
    </Animated.View>
  );
}
