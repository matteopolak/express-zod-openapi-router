import { createDocument, operation, Router } from 'express-zod-openapi';
import { expect, test } from 'vitest';
import { z } from 'zod';

test('no operation includes path', () => {
	const router = Router();

	router.get('/');

	const document = createDocument({
		openapi: '3.1.0',
		info: {
			title: 'Test',
			version: '1.0.0'
		}
	}, router);

	expect(document.paths).toStrictEqual({
		'/': {
			get: {
				responses: {}
			}
		}
	});
});

test('operation includes body', () => {
	const Body = z.object({
		name: z.string()
	});

	const router = Router();

	router.post('/', operation({ body: Body }));

	const document = createDocument({
		openapi: '3.1.0',
		info: {
			title: 'Test',
			version: '1.0.0'
		}
	}, router);

	expect(document.paths).toStrictEqual({
		'/': {
			post: {
				responses: {},
				requestBody: {
					content: {
						'application/json': {
							schema: {
								type: 'object',
								properties: {
									name: {
										type: 'string'
									}
								},
								required: ['name']
							}
						}
					}
				}
			}
		}
	});
});

test('operation includes query', () => {
	const Query = z.object({
		name: z.string()
	});

	const router = Router();

	router.post('/', operation({ query: Query }));

	const document = createDocument({
		openapi: '3.1.0',
		info: {
			title: 'Test',
			version: '1.0.0'
		}
	}, router);

	expect(document.paths).toStrictEqual({
		'/': {
			post: {
				responses: {},
				parameters: [
					{
						in: 'query',
						name: 'name',
						required: true,
						schema: {
							type: 'string'
						}
					}
				]
			}
		}
	});
});

test('operation includes path parameter', () => {
	const Path = z.object({
		name: z.string()
	});

	const router = Router();

	router.post('/', operation({ path: Path }));

	const document = createDocument({
		openapi: '3.1.0',
		info: {
			title: 'Test',
			version: '1.0.0'
		}
	}, router);

	expect(document.paths).toStrictEqual({
		'/': {
			post: {
				responses: {},
				parameters: [
					{
						in: 'path',
						name: 'name',
						required: true,
						schema: {
							type: 'string'
						}
					}
				]
			}
		}
	});
});

test('operation includes extra metadata', () => {
	const router = Router();

	router.post('/', operation({
		summary: 'Test',
		description: 'Test operation',
		tags: ['test']
	}));

	const document = createDocument({
		openapi: '3.1.0',
		info: {
			title: 'Test',
			version: '1.0.0'
		}
	}, router);

	expect(document.paths).toStrictEqual({
		'/': {
			post: {
				responses: {},
				summary: 'Test',
				description: 'Test operation',
				tags: ['test']
			}
		}
	});
});

test('nesting router joins path', () => {
	const router = Router();

	router.post('/', operation({
		summary: 'Test',
		description: 'Test operation',
	}));

	const nested = Router();

	nested.post('/more', operation({
		summary: 'Nested',
		description: 'Nested operation',
	}));

	router.use('/nested', nested);

	const document = createDocument({
		openapi: '3.1.0',
		info: {
			title: 'Test',
			version: '1.0.0'
		}
	}, router);

	expect(document.paths).toStrictEqual({
		'/': {
			post: {
				responses: {},
				summary: 'Test',
				description: 'Test operation',
			}
		},
		'/nested/more': {
			post: {
				responses: {},
				summary: 'Nested',
				description: 'Nested operation',
			}
		}
	});
});

test('trailing slash is stripped', () => {
	const router = Router();

	router.post('/hello/');

	const document = createDocument({
		openapi: '3.1.0',
		info: {
			title: 'Test',
			version: '1.0.0'
		}
	}, router);

	expect(document.paths).toStrictEqual({
		'/hello': {
			post: {
				responses: {},
			}
		},
	});
});

