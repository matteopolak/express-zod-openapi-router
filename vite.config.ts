import { resolve } from 'node:path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
	resolve: {
		alias: {
			'express-zod-openapi': resolve(__dirname, 'src/index.ts'),
		}
	}
});

