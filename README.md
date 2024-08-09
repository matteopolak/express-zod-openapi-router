# Express Zod OpenAPI

A thin wrapper around Express to validate requests and generate OpenAPI documentation.

## Features

-

## Installation

```bash
npm install express-zod-openapi
pnpm add express-zod-openapi
```

## Example

Examples can be run with `EXAMPLE={name} pnpm example`, see more examples in the [examples](./examples) directory.

```typescript
import express from 'express';
import { z } from 'zod';
import { createDocument, operation, Router } from 'express-zod-openapi';

const app = express();
const router = Router();

app.use(express.json());

const Query = z.object({
  name: z.string().default('world').openapi({
    description: 'The name to say hello to',
    example: 'John Smith'
  }),
});

router.get('/hello', operation({
  summary: 'Say hello',
  description: 'Say hello to the world',
  query: Query,
}, (req, res) => {
  res.json({ message: `Hello, ${req.query.name}!` });
  //                                ^^^^^ { name: string }
}));

const document = createDocument({
  title: 'Hello World',
  version: '1.0.0',
  servers: [{ url: 'http://localhost:3000' }],
}, router);

app.use('/openapi.json', (req, res) => {
  res.json(document);
});

app.listen(3000, () => {
  console.log('Listening on http://localhost:3000');
});
```

## Limitations

- Only supports `application/json` bodies for documentation.
  However, other content types can be validated against by implementing middleware
  that transforms the body into an object of the right shape.
- Does not support `RegExp` paths, only `string` and `string[]`.
