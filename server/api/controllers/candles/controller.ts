import { Request, Response } from 'express';
import l from '../../../common/logger'
export class Controller {
	config(req: Request, res: Response): void {
		l.info(req.params);
		res.json({
			supports_search:false,
			supports_group_request:true,
			support_marks:false,
			supports_timescale_marks:false,
			supports_time:false,
			exchanges:[{
				value:'',
				name:'bot simulation',
				desc:''
			}],
			symbols_types: [{
				name:'crypto',
				value:''
			}],
			supported_resolutions: [
				'1m'
			]
		});
	}

	symbolInfo(req: Request, res: Response): void {
		res.json({
			symbol:['XBTUSD'],
			description:['bitcoin dollar'],
			'exchange-listed':['bot simulation'],
			'exchange-traded':['bot simulation'],
			minmovement:[5],
			pricescale:[10],
			minmovement2:[0],
			fractional:[false],
			has_intraday:[true],
			intraday_multipliers:['1'],
			'has-no-volume':[true],
			type:['bitcoin'],
			timezone:['Etc/UTC'],
			'session-regular':['24x7']

				 });
	}
}
export default new Controller();
