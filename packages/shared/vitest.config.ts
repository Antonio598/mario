import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    // La logica de fechas depende de la zona horaria del proceso. Fijandola a
    // UTC, las pruebas dan el mismo resultado en tu maquina y en el CI.
    // Cualquier fallo por zona horaria sera un fallo real, no ruido.
    environment: 'node',
  },
});
