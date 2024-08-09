import express from 'express';
import { operation } from 'express-axum/operation';
import { Router } from 'express-axum/router';
import { z } from 'zod';

const router = new Router();

router.get('/hello', operation({
	body: z.object({
		hello: z.number().default(10)
	})
}), (req, res) => {
		
});
