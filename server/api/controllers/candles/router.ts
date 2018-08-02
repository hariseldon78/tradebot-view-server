import * as express from 'express';
import controller from './controller'
export default express.Router()
	.get('/config', controller.config)
	.get('/symbol_info',controller.symbolInfo)