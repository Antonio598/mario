import { useEffect, useRef } from 'react';
import { Animated, View, useWindowDimensions } from 'react-native';
import { colors, spacing } from '../../theme';

interface Props {
  paso: number;
  total: number;
}

/**
 * Barra de progreso del formulario.
 *
 * Saber cuanto queda es lo que evita el abandono a mitad: sin ella, cada
 * pantalla nueva parece una mas de una lista sin final.
 *
 * Se anima con `useNativeDriver: false` porque `width` no es una propiedad que
 * el hilo nativo pueda interpolar. Es un elemento pequeno y el coste es
 * inapreciable; con transform habria que reestructurar el layout para ganar
 * muy poco.
 */
export function BarraProgreso({ paso, total }: Props) {
  const { width } = useWindowDimensions();
  const disponible = width - spacing.lg * 2;
  const progreso = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progreso, {
      toValue: total > 0 ? (paso + 1) / total : 0,
      duration: 260,
      useNativeDriver: false,
    }).start();
  }, [paso, total, progreso]);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 1, max: total, now: paso + 1 }}
      style={{
        height: 3,
        backgroundColor: colors.negroBorde,
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      <Animated.View
        style={{
          height: 3,
          backgroundColor: colors.rojo,
          width: progreso.interpolate({
            inputRange: [0, 1],
            outputRange: [0, disponible],
          }),
        }}
      />
    </View>
  );
}
