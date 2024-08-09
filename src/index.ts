import { Handler, Router as ExpressRouter } from 'express';
import { OpenAPIV3_1 } from 'openapi-types';
import { z } from 'zod';
import { createDocument as createDocumentFromZod, extendZodWithOpenApi, ZodOpenApiObject } from 'zod-openapi';

import { RouterBuilder } from './router';

extendZodWithOpenApi(z);

export { ErrorHandler, Operation, operation, OperationHandler } from './operation';
export { RouterBuilder } from './router';

export type Router = RouterBuilder & Handler & Omit<ExpressRouter, keyof InstanceType<typeof RouterBuilder>>;

/**
 * Creates a new router.
 *
 * @example
 * ```ts
 * const router = Router();
 *
 * router.get('/hello', (req, res) => {
 *   res.send('Hello, world!');
 * });
 * ```
 */
export function Router() {
	const builder = new RouterBuilder();
	const router: Handler = (...args) => builder.inner(...args);

	Object.setPrototypeOf(router, builder.inner);
	extendPrototype(router, builder);
	extendPrototype(router, RouterBuilder.prototype);

	return router as Router;
}

function extendPrototype<T extends object, U extends object>(target: T, source: U): T & U {
	for (const key of Object.getOwnPropertyNames(source)) {
		const desc = Object.getOwnPropertyDescriptor(target, key);
		if (desc?.writable === false) continue;
		if (key === 'constructor') continue;

		// @ts-expect-error - allow overwriting
		target[key] = source[key];
	}

	return target as T & U;
}

/**
 * Creates an OpenAPI document from the given {@link ZodOpenApiObject} and {@link Router}.
 *
 * @param base - The base OpenAPI document object.
 * @param router - The router to extract operations from.
 * @param basePath - The base path to prepend to all paths in the OpenAPI document.
 *
 * @returns The OpenAPI document.
 *
 * @example
 * ```ts
 * const document = createDocument({
 *   openapi: '3.1.0',
 *   info: {
 *     title: 'My API',
 *     version: '1.0.0',
 *   },
 * }, router);
 * ```
 */
export function createDocument(
	base: ZodOpenApiObject,
	router: Router,
	basePath = '/'
): OpenAPIV3_1.Document {
	base.paths ??= {};
	router.extend(basePath, base.paths);

	return createDocumentFromZod(base) as OpenAPIV3_1.Document;
}

