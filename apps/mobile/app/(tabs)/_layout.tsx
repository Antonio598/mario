import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, fontSize } from '../../src/theme';

/**
 * Navegacion principal: Inicio · Formacion · Tienda · Calendario · Perfil.
 *
 * En la Fase 1 las pantallas estan vacias a proposito. El criterio de
 * aceptacion es que un usuario se registre, entre y pueda recorrer las cinco.
 */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.negro },
        headerTintColor: colors.blanco,
        headerTitleStyle: { fontWeight: '700', letterSpacing: 1 },
        tabBarStyle: {
          backgroundColor: colors.negro,
          borderTopColor: colors.negroBorde,
        },
        tabBarActiveTintColor: colors.rojo,
        tabBarInactiveTintColor: colors.grisTenue,
        tabBarLabelStyle: { fontSize: fontSize.xs },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => <Ionicons name="flame" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="formacion"
        options={{
          title: 'Formacion',
          tabBarIcon: ({ color, size }) => <Ionicons name="school" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="tienda"
        options={{
          title: 'Tienda',
          tabBarIcon: ({ color, size }) => <Ionicons name="bag" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="calendario"
        options={{
          title: 'Calendario',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
