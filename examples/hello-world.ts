import express from 'express';
import { Router, createDocument, operation } from 'express-axum';
import { z } from 'zod';
import { apiReference } from '@scalar/express-api-reference';

const app = express();
const router = Router();

router.get('/hello', operation({
	body: z.object({
		name: z.string(),
	}).openapi({ ref: 'Hello' })
}), (req, res) => {
	res.send(`Hello, ${req.body.name}!`);
});

const document = createDocument(
	{
		openapi: '3.1.0',
		info: {
			title: 'My API',
			version: '1.0.0',
		},
	},
	router
);

app.get('/openapi.json', (_req, res) => {
	res.json(document);
});

app.use(
	'/docs',
	apiReference({
		spec: {
			url: '/openapi.json',
		},
	}),
);

app.use(router);

app.listen(3000, () => {
	console.log('Server listening on port 3000');
});

