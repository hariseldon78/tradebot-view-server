import * as express from 'express';
import controller from './controller'
export default express.Router()
	.get('/candles', controller.candles)
	.get('/trades',controller.trades);
