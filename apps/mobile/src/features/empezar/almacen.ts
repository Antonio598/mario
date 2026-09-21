import AsyncStorage from '@react-native-async-storage/async-storage';
import { CLAVE_ALMACEN, planCompleto, type RespuestasPlan } from '@reset-alfa/shared';

/**
 * Respuestas del test de entrada, antes de que exista cuenta.
 *
 * AsyncStorage y no SecureStore: no son datos sensibles del art. 9 (edad,
 * frecuencia, objetivo) y SecureStore tiene un tope de 2 KB por valor.
 * Se borran en cuanto se guardan en el perfil.
 */
export async function leerPlanLocal(): Promise<RespuestasPlan> {
  try {
    const bruto = await AsyncStorage.getItem(CLAVE_ALMACEN);
    if (bruto === null) return {};
    const obj = JSON.parse(bruto) as unknown;
    return typeof obj === 'object' && obj !== null ? (obj as RespuestasPlan) : {};
  } catch {
    return {};
  }
}

export async function escribirPlanLocal(plan: RespuestasPlan): Promise<void> {
  try {
    await AsyncStorage.setItem(CLAVE_ALMACEN, JSON.stringify(plan));
  } catch {
    // Sin importancia: el test sigue funcionando en memoria.
  }
}

export async function borrarPlanLocal(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CLAVE_ALMACEN);
  } catch {
    // Ya esta en el servidor.
  }
}

export async function hayPlanLocalCompleto(): Promise<RespuestasPlan | null> {
  const plan = await leerPlanLocal();
  return planCompleto(plan) ? plan : null;
}
