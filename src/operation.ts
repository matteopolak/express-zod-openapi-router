import { Request, RequestHandler, Response } from 'express';
import { z, ZodError, ZodSchema, ZodType, ZodTypeDef } from 'zod';
import { ZodOpenApiOperationObject } from 'zod-openapi';

export type AnyObject = Record<string, unknown>;

export type Operation<Body, Query, Params> = Omit<ZodOpenApiOperationObject, 'requestBody' | 'requestParams' | 'responses'> & {
	body?: ZodSchema<Body, ZodTypeDef, unknown>,
	query?: ZodType<Query, ZodTypeDef, AnyObject>,
	params?: ZodType<Params, ZodTypeDef, AnyObject>,
	responses?: ZodOpenApiOperationObject['responses'],
};

export type InternalOperation = Partial<ZodOpenApiOperationObject>;
export type Method = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head';

const operationSymbol = Symbol('operation');

export type OperationHandler<Body = never, Query = never, Params = never> = RequestHandler<Params, unknown, Body, Query> & {
	operation: InternalOperation,
	symbol: typeof operationSymbol,
};

export type ErrorHandler<Body, Query, Params> =
	(req: Request<Params, unknown, Body, Query>, res: Response, error: ZodError) => void;

export function defaultErrorHandler<B, Q, P>(_req: Request<P, unknown, B, Q>, res: Response, error: ZodError) {
	res.status(400).json(error.issues);
}

/**
 * Validates incoming requests with the given schema, adding
 * it to the OpenAPI document.
 *
 * @param operation Operation to be performed
 */
export function operation<Body = never, Query extends AnyObject = never, Params extends AnyObject = never>(
	operation: Operation<Body, Query, Params>,
	handleError: ErrorHandler<Body, Query, Params> = defaultErrorHandler
): OperationHandler<Body, Query, Params> {
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
			path: operation.params,
		}
	};

	if (operation.body || operation.query || operation.params) {
		const schema = z.object({
			body: operation.body!,
			query: operation.query!,
			params: operation.params!,
		});

		const handler: OperationHandler<Body, Query, Params> = (req, res, next) => {
			const result = schema.safeParse({
				body: req.body,
				query: req.query,
				params: req.params,
			});

			if (result.success) {
				next();
			} else {
				handleError(req, res, result.error);
			}
		};

		handler.symbol = operationSymbol;
		handler.operation = internalOperation;

		return handler;
	} else {
		const handler: OperationHandler<Body, Query, Params> = (_req, _res, next) => {
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

