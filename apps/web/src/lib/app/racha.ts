import { LIMITE_RACHA_GRATIS } from './enlaces';

/**
 * Como se ensena una cifra de dias segun el plan.
 *
 * En gratis, por encima del limite se muestra "30+" y no el numero. La racha
 * real sigue contando en el servidor -no se toca ningun dato-, y precisamente
 * por eso el numero real es el argumento de venta: "tu racha real es de 47
 * dias" solo funciona si esos 47 existen.
 */
export function mostrarDias(dias: number, esPremium: boolean): string {
  if (!esPremium && dias > LIMITE_RACHA_GRATIS) return `${LIMITE_RACHA_GRATIS}+`;
  return String(dias);
}

/** True si la cifra esta recortada por el plan gratuito. */
export function rachaRecortada(dias: number, esPremium: boolean): boolean {
  return !esPremium && dias > LIMITE_RACHA_GRATIS;
}
