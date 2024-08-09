import { z } from 'zod';
import { RouterBuilder } from './router';
import { createDocument as createDocumentFromZod, ZodOpenApiObject, extendZodWithOpenApi } from 'zod-openapi';
import { Handler } from 'express';

export { RouterBuilder } from './router';
export { ErrorHandler, Operation, OperationHandler, operation } from './operation';

export type Router = RouterBuilder & Handler;

export function Router(): Router {
	const builder = new RouterBuilder();
	// @ts-expect-error - We're forwarding arguments to the inner Express handler, which takes the
	// exact same arguments as the `Router` callable.
	const router = (...args) => builder.inner(...args);

	Object.setPrototypeOf(router, builder);

	// @ts-expect-error - We set the prototype above, so this is OK.
	return router;
}

export function createDocument(
	base: ZodOpenApiObject,
	router: Router,
	basePath = '/'
) {
	base.paths ??= {};
	router.extend(basePath, base.paths);

	return createDocumentFromZod(base);
}

extendZodWithOpenApi(z);

