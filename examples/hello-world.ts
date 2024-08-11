import { apiReference } from '@scalar/express-api-reference';
import express from 'express';
import { createDocument, operation, Router } from 'express-zod-openapi-router';
import { z } from 'zod';

const app = express();
const router = Router();

app.use(express.json());
app.use(router);

const Person = z.object({
	name: z.string().openapi({ example: 'Alice' }),
})
	.openapi({ ref: 'Person' });

router.get('/hello', operation({
	summary: 'Greet person',
	description: 'Greets the given person by name.',
	query: Person
}), (req, res) => {
	res.json({
		message: `Hello, ${req.query.name}!`
	});
});

router.post('/hello', operation({
	summary: 'Greet person',
	description: 'Greets the given person by name.',
	body: Person
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

app.listen(3000, () => {
	console.log('Server listening on port 3000');
});

