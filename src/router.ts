import { join } from 'path';

import { Router as ExpressRouter } from 'express';
import { ZodOpenApiPathsObject } from 'zod-openapi';
import { InternalOperation, isOperationHandler, Method } from './operation';
import { RouterMatcher } from './matcher';

export class RouterBuilder {
	public inner: ExpressRouter;
	public paths: ZodOpenApiPathsObject;

	constructor(router?: ExpressRouter) {
		this.inner = router ?? ExpressRouter();
		this.paths = {};
	}

	public readonly get: RouterMatcher = this.createMethod('get');
	public readonly post: RouterMatcher = this.createMethod('post');
	public readonly put: RouterMatcher = this.createMethod('put');
	public readonly delete: RouterMatcher = this.createMethod('delete');
	public readonly patch: RouterMatcher = this.createMethod('patch');
	public readonly options: RouterMatcher = this.createMethod('options');
	public readonly head: RouterMatcher = this.createMethod('head');

	public use(path: string, router: RouterBuilder) {
		this.inner.use(path, router.inner);
	}

	/**
	 * Builds the OpenAPI document, prepending the given path to all local paths,
	 * then adding all paths to the given paths object.
	 */
	public extend(path: string, paths: ZodOpenApiPathsObject) {
		for (const localPath in this.paths) {
			const fullPath = joinPaths(path, localPath);
			paths[fullPath] = this.paths[localPath];
		}
	}

	private createMethod(method: Method): RouterMatcher {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return (path: string | string[], ...handlers: any[]) => {
			for (const handler of handlers) {
				if (isOperationHandler(handler)) {
					if (Array.isArray(path)) {
						for (const p of path) {
							addOperation(this.paths, p, method, handler.operation);
						}
					} else {
						addOperation(this.paths, path, method, handler.operation);
					}
				}
			}

			this.inner[method](path, ...handlers);
		};
	}
}

function addOperation(paths: ZodOpenApiPathsObject, path: string, method: Method, operation: InternalOperation) {
	paths[path] ??= {};
	paths[path][method] = {
		responses: {},
		...operation,
	};
}

function joinPaths(...paths: string[]) {
	let joined = join(...paths);

	if (!joined.startsWith('/')) joined = `/${joined}`;
	if (joined.endsWith('/') && joined !== '/') joined = joined.slice(0, -1);

	return joined;
}
