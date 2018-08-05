import { Request, Response } from 'express';
import l from '../../../common/logger'
import * as fs from "fs";
import ExamplesService from '../../services/examples.service';
export class Controller {
	candles(req: Request, res: Response): void {
		console.log(process.cwd());
		const candles=fs.readFileSync('../../../bitmexbot/lastCandles.json', 'utf8');
		res.set('Content-Type', 'application/json');
		res.send(candles);
	}
	all(req: Request, res: Response): void {
		ExamplesService.all().then(r => res.json(r));
	}
}
export default new Controller();
