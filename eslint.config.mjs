import withNuxt from './.nuxt/eslint.config.mjs';

// A blank line on both sides of these makes branching easy to spot.
const BLOCK_STATEMENTS = ['if', 'for', 'while', 'do', 'switch', 'try', 'block-like'];

export default withNuxt(
  {
    name: 'modular-ds-api-example-kit/style',
    rules: {
      '@stylistic/semi': ['error', 'always'],
      '@stylistic/member-delimiter-style': ['error', {
        multiline: { delimiter: 'semi', requireLast: true },
        singleline: { delimiter: 'semi', requireLast: false },
      }],
      '@stylistic/arrow-parens': ['error', 'always'],
      '@stylistic/brace-style': ['error', '1tbs'],
      '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
      '@stylistic/comma-dangle': ['error', 'always-multiline'],
      '@stylistic/padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: '*', next: BLOCK_STATEMENTS },
        { blankLine: 'always', prev: BLOCK_STATEMENTS, next: '*' },
        { blankLine: 'always', prev: '*', next: ['function', 'class'] },
        { blankLine: 'always', prev: ['import', 'directive'], next: '*' },
        { blankLine: 'any', prev: 'import', next: 'import' },
      ],
      '@stylistic/max-statements-per-line': ['error', { max: 1 }],
      '@stylistic/lines-between-class-members': ['error', 'always', { exceptAfterSingleLine: true }],

      'curly': ['error', 'all'],
    },
  },
  {
    name: 'modular-ds-api-example-kit/quality',
    rules: {
      'eqeqeq': ['error', 'always', { null: 'ignore' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'prefer-const': 'error',
      'object-shorthand': ['error', 'always'],
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
    },
  },
  {
    name: 'modular-ds-api-example-kit/vue',
    files: ['**/*.vue'],
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/max-attributes-per-line': ['error', { singleline: { max: 5 }, multiline: { max: 1 } }],
      'vue/block-order': ['error', { order: ['script', 'template', 'style'] }],

      'vue/singleline-html-element-content-newline': 'off',

      // Dashboard pages are fragments on purpose: navbar, toolbar and body are panel siblings.
      'vue/no-multiple-template-root': 'off',
    },
  },
);
