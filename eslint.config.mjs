import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import stylistic from '@stylistic/eslint-plugin';

export default [
	{files: ['**/*.{js,mjs,cjs,ts}']},
	{languageOptions: { globals: globals.browser }},
	pluginJs.configs.recommended,
	...tseslint.configs.recommended,
	{
		plugins: {
			'@stylistic': stylistic
		},
		rules: {
			'@stylistic/quotes': ['error', 'single'],
			'@stylistic/indent': ['error', 'tab'],
		}
	}
];
