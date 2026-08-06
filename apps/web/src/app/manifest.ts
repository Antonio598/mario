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
    background_color: '#F5F5F5',
    theme_color: '#FFFFFF',
    lang: 'es',
    categories: ['lifestyle', 'productivity', 'health'],
    icons: [
      {
        src: '/icono.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        /**
         * `maskable` deja que Android recorte el icono a la forma del sistema
         * —círculo, cuadrado redondeado, gota— sin comerse el logotipo. El SVG
         * reserva el 20 % de margen de seguridad en todo el perímetro.
         */
        purpose: 'maskable',
      },
      {
        src: '/icono.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
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
