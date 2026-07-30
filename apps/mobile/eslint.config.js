const expoConfig = require('eslint-config-expo/flat');
const tsPlugin = require('@typescript-eslint/eslint-plugin');

module.exports = [
  ...expoConfig,
  {
    // La configuracion de Expo no registra el plugin en el mismo objeto donde
    // anadimos la regla, asi que hay que declararlo aqui explicitamente.
    plugins: { '@typescript-eslint': tsPlugin },
    rules: {
      // El brief lo pide explicitamente: TypeScript estricto, sin `any`.
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    ignores: ['dist/**', '.expo/**', 'node_modules/**'],
  },
];
