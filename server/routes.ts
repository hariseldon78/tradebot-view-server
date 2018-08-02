import {Application} from 'express';
import examplesRouter from './api/controllers/examples/router';
import candlesRouter from './api/controllers/candles/router';
import L from './common/logger'

export default function routes(app: Application): void {
	app.use('/api/v1/examples', examplesRouter);
	app.use('/api/v1/candles', candlesRouter);

};