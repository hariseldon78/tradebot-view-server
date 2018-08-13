import moment = require('moment');
import {last, StopWatch} from './utils';
import {BitmexApi, Candle, candleFromBitmex, Env} from './bitmexLowLevel';
// @ts-ignore
const api = new BitmexApi(process.env as Env);


export async function bitmexCandles(env: Env): Promise<Candle[]> {

	let start = 0;
	const to = moment().startOf('day').toISOString();
	let from = moment(to).subtract(1, 'months').toISOString();
	let candles = [];
	let newCandles: Candle[];
	let prepareToExit = false;
	const stopWatch = new StopWatch();
	const candlesTotal = (moment(to).unix() - moment(from).unix()) / 60;
	stopWatch.setTotalSteps(candlesTotal);
	try {
		while (true) {
			stopWatch.setStepsDone(candles.length);
			// console.log('---------------');
			console.log(`Downloading candles:${candles.length} of ${candlesTotal}. last:${last(candles) ? moment.unix(last(candles).timestamp).format() : '/'} (${last(candles) ? last(candles).timestamp : '/'}). ${moment.duration(stopWatch.estimatedTimeRemaining()).humanize()} remaining`);
			newCandles = (await api.makeAuthRequest(
					'/api/v1/trade/bucketed',
					'get',
					{
						binSize: '1m',
						partial: false,
						symbol: env.SYMBOL,
						count: 500,
						start: start,
						startTime: from,
						endTime: to,
					})
			).map(candleFromBitmex);
			// console.log(`${newCandles.length} candles downloaded. first: ${newCandles.length?newCandles[0].timestamp:'/'}, last:${newCandles.length?last(newCandles).timestamp:'/'}`);
			if (newCandles.length == 0) {
				if (prepareToExit)
					break;

				const toMoment = moment(to);
				const lastCandleMoment = moment.unix(last(candles).timestamp);
				if (toMoment.isSameOrBefore(lastCandleMoment))
					break;

				// why 2 works and 1 doesn't? MISTERY.
				from = lastCandleMoment.add(2, 'minute').toISOString();
				if (from == to)
					break;
				start = 0;
				console.log(`FROM moved:${from} (${last(candles).timestamp} + 1 min)`);
				prepareToExit = true;
			} else {
				candles = candles.concat(newCandles);
				start += 500;
				prepareToExit = false;
			}
			await
				new Promise(resolve => setTimeout(resolve, 350));
		}
		candles.forEach((current, index, array) => {
			if (index > 0 && current.timestamp - array[index - 1].timestamp != 60)
				console.log(`*** BAD GAP FROM ${array[index - 1].timestamp} TO ${current.timestamp} ***`);
		});
		return candles;
	} catch (e) {
		console.error('Error downloading candles:', e);
	}

}