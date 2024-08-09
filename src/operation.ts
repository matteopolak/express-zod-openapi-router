import { Request, RequestHandler, Response } from 'express';
import { z, ZodError, ZodSchema, ZodType, ZodTypeDef } from 'zod';
import { ZodOpenApiOperationObject } from 'zod-openapi';

export type AnyObject = Record<string, unknown>;

export type Operation<Body, Query, Path> = Omit<ZodOpenApiOperationObject, 'requestBody' | 'requestParams' | 'responses'> & {
	body?: ZodSchema<Body, ZodTypeDef, unknown>,
	query?: ZodType<Query, ZodTypeDef, AnyObject>,
	path?: ZodType<Path, ZodTypeDef, AnyObject>,
	responses?: ZodOpenApiOperationObject['responses'],
};

export type InternalOperation = Partial<ZodOpenApiOperationObject>;
export type Method = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head';

const operationSymbol = Symbol('operation');

export type OperationHandler<Body = never, Query = never, Path = never> = RequestHandler<Path, unknown, Body, Query> & {
	operation: InternalOperation,
	symbol: typeof operationSymbol,
};

export type ErrorHandler<Body, Query, Path> =
	(req: Request<Path, unknown, Body, Query>, res: Response, error: ZodError) => void;

export function defaultErrorHandler<B, Q, P>(_req: Request<P, unknown, B, Q>, res: Response, error: ZodError) {
	res.status(400).json(error.issues);
}

/**
 * Validates incoming requests with the given schema, adding
 * it to the OpenAPI document.
 *
 * @param operation Operation to be performed
 */
export function operation<Body = never, Query extends AnyObject = never, Path extends AnyObject = never>(
	operation: Operation<Body, Query, Path>,
	handleError: ErrorHandler<Body, Query, Path> = defaultErrorHandler
): OperationHandler<Body, Query, Path> {
	const internalOperation: InternalOperation = {
		...operation,
		requestBody: operation.body && {
			content: {
				'application/json': {
					schema: operation.body
				}
			}
		},
		requestParams: {
			query: operation.query,
			path: operation.path,
		}
	};

	// Remove the body, query, and path from the operation
	// @ts-expect-error - `body`, `query`, and `path` are not part of the OpenAPI spec
	delete internalOperation.body;
	// @ts-expect-error - `body`, `query`, and `path` are not part of the OpenAPI spec
	delete internalOperation.query;
	// @ts-expect-error - `body`, `query`, and `path` are not part of the OpenAPI spec
	delete internalOperation.path;

	if (operation.body || operation.query || operation.path) {
		const schema = z.object({
			body: operation.body ?? z.any(),
			query: operation.query ?? z.any(),
			path: operation.path ?? z.any(),
		});

		const handler: OperationHandler<Body, Query, Path> = (req, res, next) => {
			const result = schema.safeParse({
				body: req.body,
				query: req.query,
				path: req.params,
			});

			if (result.success) {
				req.body = result.data.body;
				req.query = result.data.query;
				req.params = result.data.path;

				next();
			} else {
				handleError(req, res, result.error);
			}
		};

		handler.symbol = operationSymbol;
		handler.operation = internalOperation;

		return handler;
	} else {
		const handler: OperationHandler<Body, Query, Path> = (_req, _res, next) => {
			next();
		};

		handler.symbol = operationSymbol;
		handler.operation = internalOperation;

		return handler;
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isOperationHandler(handler: any): handler is OperationHandler {
	return handler.symbol === operationSymbol;
}

