import { z } from 'zod';
import { operation } from './operation';

operation({
	body: z.object({
		hello: z.number().default(10)
	})
});

