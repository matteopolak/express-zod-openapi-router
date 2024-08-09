import pluginJs from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
	{
		files: ['**/*.ts', '*.mjs']
	},
	{
		ignores: ['lib/**', 'examples/build-examples/**']
	},
	{languageOptions: { globals: globals.browser }},
	pluginJs.configs.recommended,
	...tseslint.configs.recommended,
	{
		plugins: {
			'@stylistic': stylistic,
			'simple-import-sort': simpleImportSort,

		},
		rules: {
			'@stylistic/quotes': ['error', 'single'],
			'@stylistic/indent': ['error', 'tab'],
			'simple-import-sort/imports': 'error',
			'simple-import-sort/exports': 'error',
		}
	}
];
