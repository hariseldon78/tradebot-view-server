import {Application} from 'express';
import examplesRouter from './api/controllers/examples/router';
import simulationRouter from './api/controllers/simulation/router';
import bitmexRouter from './api/controllers/bitmex/router';
import L from './common/logger'

export default function routes(app: Application): void {
	app.use('/api/v1/examples', examplesRouter);
	app.use('/api/v1/simulation', simulationRouter);
	app.use('/api/v1/bitmex', bitmexRouter);
	app.use('/api/v1/candles', bitmexRouter);
};