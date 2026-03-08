import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

const FEATURE_NAMES = ['search', 'home', 'library', 'settings', 'player', 'admin']

const getCrossFeaturePatterns = (featureName) =>
  FEATURE_NAMES
    .filter((name) => name !== featureName)
    .flatMap((name) => [
      `../${name}`,
      `../${name}/**`,
      `../../${name}`,
      `../../${name}/**`,
      `**/features/${name}`,
      `**/features/${name}/**`,
    ])

const featureBoundaryConfigs = FEATURE_NAMES.map((featureName) => ({
  files: [`src/features/${featureName}/**/*.{js,jsx}`],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: getCrossFeaturePatterns(featureName),
      },
    ],
  },
}))

export default defineConfig([
  globalIgnores(['dist', 'jiosaavn-api/dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
  {
    files: ['src/**/*.{js,jsx}'],
    ignores: [
      'src/features/**/*.{js,jsx}',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: ['**/features/*/ui/**', '**/features/*/hooks/**'],
        },
      ],
    },
  },
  ...featureBoundaryConfigs,
  {
    files: ['src/**/*.test.{js,jsx}'],
    languageOptions: {
      globals: {
        describe: true,
        test: true,
        expect: true,
      },
    },
  },
])
