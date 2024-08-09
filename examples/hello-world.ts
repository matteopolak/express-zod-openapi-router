import express from 'express';
import { Router, createDocument, operation } from 'express-axum';
import { z } from 'zod';
import { apiReference } from '@scalar/express-api-reference';

const app = express();
const router = Router();

app.use(express.json());
app.use(router);

const Person = z.object({
	name: z.string(),
})
	.openapi({ ref: 'Person' });

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

