import type { MetadataRoute } from 'next';

/**
 * Manifiesto de la PWA.
 *
 * Es lo que permite instalar Reset Alfa en la pantalla de inicio del móvil y
 * que se abra sin barra de navegador, como una app.
 *
 * VENTAJA DE NEGOCIO, no solo técnica: en la web puedes vender directamente,
 * sin la comisión del 15-30 % que Apple y Google cobran por el contenido
 * digital vendido dentro de una app nativa. La PWA es a la vez herramienta de
 * retención y canal de venta sin intermediario.
 *
 * `start_url` apunta a /app y no a la portada: quien instala el icono quiere
 * abrir su racha, no leer el blog.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Reset Alfa · Disciplina, Enfoque, Libertad',
    short_name: 'Reset Alfa',
    description:
      'Seguimiento de hábitos y disciplina. Lleva la cuenta de tu racha, registra tus recaídas y detecta tus patrones.',
    start_url: '/app',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    /*
      Colores de la pantalla de arranque. Van en oscuro porque la app arranca
      en oscuro: con el blanco anterior, abrir el icono instalado daba un
      fogonazo blanco antes de pintar la interfaz negra. En una app que se abre
      de noche, ese fogonazo es justo lo que hace que se cierre.
    */
    background_color: '#0A0A0A',
    theme_color: '#0A0A0A',
    lang: 'es',
    categories: ['lifestyle', 'productivity', 'health'],
    icons: [
      {
        src: '/logos/app.png',
        sizes: '1080x1080',
        type: 'image/png',
        purpose: 'any',
      },
      {
        /**
         * `maskable` es un icono APARTE, no el mismo con otra etiqueta.
         * Android recorta estos iconos a la forma del sistema —circulo,
         * cuadrado redondeado, gota— y puede comerse hasta el 20 % del borde.
         * El SVG reserva ese margen; el PNG de marca ocupa todo el lienzo y
         * perderia parte del logotipo al recortarse.
         */
        src: '/icono.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],

    shortcuts: [
      {
        name: 'Mi racha',
        url: '/app',
        description: 'Contador y check-in de hoy',
      },
      {
        name: 'Calendario',
        url: '/app/calendario',
        description: 'Historial mensual',
      },
    ],
  };
}
