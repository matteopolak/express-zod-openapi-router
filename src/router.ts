import { Router as ExpressRouter } from 'express';
import { join } from 'path';
import { parse } from 'path-to-regexp';
import { ZodOpenApiPathsObject } from 'zod-openapi';

import { RouterMatcher } from './matcher';
import { InternalOperation, isOperationHandler, Method } from './operation';

export class RouterBuilder {
	public inner: ExpressRouter;
	private paths: ZodOpenApiPathsObject;
	private nested: Record<string, RouterBuilder>;

	constructor(router?: ExpressRouter) {
		this.inner = router ?? ExpressRouter();
		this.paths = {};
		this.nested = {};
	}

	/**
	 * Matches a GET request to the given path.
	 *
	 * @param path - The path to match.
	 * @param handlers - The request handlers.
	 */
	public readonly get: RouterMatcher = this.createMethod('get');
	/**
	 * Matches a POST request to the given path.
	 *
	 * @param path - The path to match.
	 * @param handlers - The request handlers.
	 */
	public readonly post: RouterMatcher = this.createMethod('post');
	/**
	 * Matches a PUT request to the given path.
	 *
	 * @param path - The path to match.
	 * @param handlers - The request handlers.
	 */
	public readonly put: RouterMatcher = this.createMethod('put');
	/**
	 * Matches a DELETE request to the given path.
	 *
	 * @param path - The path to match.
	 * @param handlers - The request handlers.
	 */
	public readonly delete: RouterMatcher = this.createMethod('delete');
	/**
	 * Matches a PATCH request to the given path.
	 *
	 * @param path - The path to match.
	 * @param handlers - The request handlers.
	 */
	public readonly patch: RouterMatcher = this.createMethod('patch');
	/**
	 * Matches an OPTIONS request to the given path.
	 *
	 * @param path - The path to match.
	 * @param handlers - The request handlers.
	 */
	public readonly options: RouterMatcher = this.createMethod('options');
	/**
	 * Matches a HEAD request to the given path.
	 *
	 * @param path - The path to match.
	 * @param handlers - The request handlers.
	 */
	public readonly head: RouterMatcher = this.createMethod('head');

	/**
	 * Nests a router under the given path.
	 */
	public use(path: string, router: RouterBuilder) {
		this.inner.use(path, router.inner);
		this.nested[path] = router;
	}

	/**
	 * Builds the OpenAPI document, prepending the given path to all local paths,
	 * then adding all paths to the given paths object.
	 *
	 * @param path - The path to prepend to all local paths.
	 * @param paths - The paths object to add the local paths to.
	 */
	public extend(path: string, paths: ZodOpenApiPathsObject) {
		for (const localPath in this.paths) {
			const fullPath = joinPaths(path, localPath);
			paths[fullPath] = this.paths[localPath];
		}

		for (const localPath in this.nested) {
			this.nested[localPath].extend(joinPaths(path, localPath), paths);
		}
	}

	private createMethod(method: Method): RouterMatcher {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return (path: string | string[], ...handlers: any[]) => {
			let hasOperation = false;

			for (const handler of handlers) {
				if (isOperationHandler(handler)) {
					hasOperation = true;

					if (Array.isArray(path)) {
						for (const p of path) {
							addOperation(this.paths, p, method, handler.operation);
						}
					} else {
						addOperation(this.paths, path, method, handler.operation);
					}
				}
			}

			if (!hasOperation) {
				if (Array.isArray(path)) {
					for (const p of path) {
						addOperation(this.paths, p, method, {});
					}
				} else {
					addOperation(this.paths, path, method, {});
				}
			}

			this.inner[method](path, ...handlers);
		};
	}
}

function addOperation(paths: ZodOpenApiPathsObject, path: string, method: Method, operation: InternalOperation) {
	const parsed = parse(path);
	const formattedPath = parsed.tokens
		.map(t => typeof t === 'string' ? t : `{${t.name}}`)
		.join('');

	paths[formattedPath] ??= {};
	paths[formattedPath][method] = {
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
