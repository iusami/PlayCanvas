module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'electron'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh', '@typescript-eslint'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    'no-unused-vars': 'off',
    'no-redeclare': 'off',
    'no-unreachable': 'error',
    'no-empty': 'error',
    'no-unexpected-multiline': 'error',
    'no-case-declarations': 'error',
    'no-prototype-builtins': 'error',
    // TypeScript specific rules (full strictness restored)
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn', // Keep as warn due to Konva integration needs
  },
}